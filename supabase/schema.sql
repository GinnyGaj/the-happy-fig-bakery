-- The Happy Fig — schema
create extension if not exists "pgcrypto";

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  price decimal(10, 2) not null,
  image_url varchar(500),
  dietary_tags jsonb not null default '[]',
  is_free_item boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table weekly_menus (
  id uuid primary key default gen_random_uuid(),
  week_start_date date not null unique,
  pickup_date date,
  pickup_start_time time,
  pickup_end_time time,
  menu_item_ids uuid[] not null default '{}',
  is_published boolean not null default false,
  form_open boolean not null default false,
  announcement_message text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stock_limits (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references weekly_menus(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  pickup_date date not null,
  stock_limit integer not null,
  current_stock integer not null,
  updated_at timestamptz not null default now(),
  unique (weekly_menu_id, menu_item_id, pickup_date)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references weekly_menus(id) on delete cascade,
  pickup_date date not null,
  customer_first_name varchar(255) not null,
  customer_last_name varchar(255) not null,
  customer_whatsapp varchar(20) not null,
  order_items jsonb not null default '[]',
  order_subtotal decimal(10, 2) not null,
  special_instructions text,
  status varchar(50) not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  collection_instructions text,
  reminder_template text,
  twilio_account_sid varchar(255),
  twilio_auth_token varchar(255),
  whatsapp_sender_number varchar(20),
  updated_at timestamptz not null default now()
);

create table whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  customer_whatsapp varchar(20),
  message_sent text,
  status varchar(50),
  error_message text,
  sent_at timestamptz not null default now()
);

-- Migration: add pickup time window to weekly_menus (safe to re-run)
alter table weekly_menus add column if not exists pickup_start_time time;
alter table weekly_menus add column if not exists pickup_end_time time;

-- Migration: add per-item order max limit (null = unlimited) (safe to re-run)
alter table menu_items add column if not exists max_limit integer;

-- Migration: scope stock counters and orders to pickup_date, not just
-- weekly_menu_id, so republishing the same week's row with a new pickup
-- date starts a fresh order count instead of carrying over the old one
-- (safe to re-run).
alter table stock_limits add column if not exists pickup_date date;
update stock_limits sl
set pickup_date = wm.pickup_date
from weekly_menus wm
where sl.weekly_menu_id = wm.id and sl.pickup_date is null and wm.pickup_date is not null;
delete from stock_limits where pickup_date is null;
alter table stock_limits alter column pickup_date set not null;
alter table stock_limits drop constraint if exists stock_limits_weekly_menu_id_menu_item_id_key;
alter table stock_limits add constraint stock_limits_weekly_menu_id_menu_item_id_pickup_date_key
  unique (weekly_menu_id, menu_item_id, pickup_date);

alter table orders add column if not exists pickup_date date;
update orders o
set pickup_date = wm.pickup_date
from weekly_menus wm
where o.weekly_menu_id = wm.id and o.pickup_date is null and wm.pickup_date is not null;
update orders set pickup_date = created_at::date where pickup_date is null;
alter table orders alter column pickup_date set not null;

-- Migration: track whether the pickup-day WhatsApp reminder has been sent (safe to re-run)
alter table orders add column if not exists reminder_sent boolean not null default false;

-- Places an order and decrements stock atomically in a single transaction.
-- Stock for each limited item is checked-and-decremented via a single
-- locked UPDATE, so concurrent orders for the same item serialize instead
-- of racing on a stale read. If any item is sold out, the whole order
-- (including any decrements already applied in this call) is rolled back.
create or replace function place_order(
  p_weekly_menu_id uuid,
  p_first_name varchar,
  p_last_name varchar,
  p_whatsapp varchar,
  p_special_instructions text,
  p_items jsonb,
  p_subtotal decimal
) returns uuid as $$
declare
  v_order_id uuid;
  v_pickup_date date;
  v_item jsonb;
  v_item_id uuid;
  v_quantity integer;
  v_name text;
  v_updated integer;
begin
  select pickup_date into v_pickup_date from weekly_menus where id = p_weekly_menu_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_id := (v_item->>'item_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_name := v_item->>'name';

    update stock_limits
    set current_stock = current_stock - v_quantity,
        updated_at = now()
    where weekly_menu_id = p_weekly_menu_id
      and menu_item_id = v_item_id
      and pickup_date = v_pickup_date
      and current_stock >= v_quantity;

    get diagnostics v_updated = row_count;

    -- v_updated = 0 with a matching row present means insufficient stock.
    -- No matching row at all means the item is unlimited (no stock_limits row).
    if v_updated = 0 and exists (
      select 1 from stock_limits
      where weekly_menu_id = p_weekly_menu_id and menu_item_id = v_item_id and pickup_date = v_pickup_date
    ) then
      raise exception 'SOLD_OUT:%', v_name;
    end if;
  end loop;

  insert into orders (
    weekly_menu_id, pickup_date, customer_first_name, customer_last_name, customer_whatsapp,
    order_items, order_subtotal, special_instructions
  ) values (
    p_weekly_menu_id, v_pickup_date, p_first_name, p_last_name, p_whatsapp,
    p_items, p_subtotal, p_special_instructions
  ) returning id into v_order_id;

  return v_order_id;
end;
$$ language plpgsql;

-- Deletes an order and restores any stock it had consumed, atomically.
-- Symmetric to place_order: for each item on the order, current_stock is
-- incremented back up (capped at stock_limit) for the order's weekly menu.
create or replace function delete_order(p_order_id uuid) returns void as $$
declare
  v_weekly_menu_id uuid;
  v_pickup_date date;
  v_order_items jsonb;
  v_item jsonb;
  v_item_id uuid;
  v_quantity integer;
begin
  select weekly_menu_id, pickup_date, order_items into v_weekly_menu_id, v_pickup_date, v_order_items
  from orders
  where id = p_order_id;

  if not found then
    return;
  end if;

  for v_item in select * from jsonb_array_elements(v_order_items)
  loop
    v_item_id := (v_item->>'item_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    update stock_limits
    set current_stock = least(stock_limit, current_stock + v_quantity),
        updated_at = now()
    where weekly_menu_id = v_weekly_menu_id
      and menu_item_id = v_item_id
      and pickup_date = v_pickup_date;
  end loop;

  delete from orders where id = p_order_id;
end;
$$ language plpgsql;

-- Row-Level Security
alter table menu_items enable row level security;
alter table weekly_menus enable row level security;
alter table stock_limits enable row level security;
alter table orders enable row level security;
alter table whatsapp_settings enable row level security;
alter table whatsapp_logs enable row level security;

create policy "menu_items are publicly readable" on menu_items for select using (true);
create policy "menu_items are admin-writable" on menu_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "weekly_menus are publicly readable" on weekly_menus for select using (true);
create policy "weekly_menus are admin-writable" on weekly_menus for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "stock_limits are publicly readable" on stock_limits for select using (true);
create policy "stock_limits are admin-writable" on stock_limits for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "orders are publicly insertable" on orders for insert with check (true);
create policy "orders are admin-readable" on orders for select using (auth.role() = 'authenticated');
create policy "orders are admin-writable" on orders for update using (auth.role() = 'authenticated');

create policy "whatsapp_settings admin only" on whatsapp_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "whatsapp_logs admin only" on whatsapp_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage: menu item images
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "menu images are publicly readable"
on storage.objects for select
using (bucket_id = 'menu-images');

create policy "menu images are admin-writable"
on storage.objects for insert
with check (bucket_id = 'menu-images' and auth.role() = 'authenticated');

create policy "menu images are admin-updatable"
on storage.objects for update
using (bucket_id = 'menu-images' and auth.role() = 'authenticated')
with check (bucket_id = 'menu-images' and auth.role() = 'authenticated');

create policy "menu images are admin-deletable"
on storage.objects for delete
using (bucket_id = 'menu-images' and auth.role() = 'authenticated');
