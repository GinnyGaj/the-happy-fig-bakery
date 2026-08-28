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
  stock_limit integer not null,
  current_stock integer not null,
  updated_at timestamptz not null default now(),
  unique (weekly_menu_id, menu_item_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  weekly_menu_id uuid not null references weekly_menus(id) on delete cascade,
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

-- Decrements stock for an item, floored at zero.
create or replace function decrement_stock(
  p_weekly_menu_id uuid,
  p_menu_item_id uuid,
  p_quantity integer
) returns void as $$
begin
  update stock_limits
  set current_stock = greatest(current_stock - p_quantity, 0),
      updated_at = now()
  where weekly_menu_id = p_weekly_menu_id
    and menu_item_id = p_menu_item_id;
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
