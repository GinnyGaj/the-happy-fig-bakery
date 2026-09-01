"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DietaryTag } from "@/lib/types";

function parseMaxLimit(formData: FormData): number | null {
  const raw = formData.get("max_limit") as string;
  if (!raw || raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function createMenuItem(formData: FormData) {
  const supabase = await createClient();

  const dietary_tags = formData.getAll("dietary_tags") as DietaryTag[];

  const { error } = await supabase.from("menu_items").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    price: Number(formData.get("price")),
    image_url: (formData.get("image_url") as string) || null,
    dietary_tags,
    is_free_item: formData.get("is_free_item") === "on",
    max_limit: parseMaxLimit(formData),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
}

export async function updateMenuItem(id: string, formData: FormData) {
  const supabase = await createClient();

  const dietary_tags = formData.getAll("dietary_tags") as DietaryTag[];

  const { error } = await supabase
    .from("menu_items")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      price: Number(formData.get("price")),
      image_url: (formData.get("image_url") as string) || null,
      dietary_tags,
      is_free_item: formData.get("is_free_item") === "on",
      max_limit: parseMaxLimit(formData),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
}

export async function updateItemMaxLimit(id: string, maxLimit: number | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ max_limit: maxLimit, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/menu");
}

export async function publishWeeklyMenu(
  weekStartDate: string,
  menuItemIds: string[],
  pickupDate: string | null,
  pickupStartTime: string | null,
  pickupEndTime: string | null
) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("weekly_menus")
    .select("id")
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("weekly_menus")
      .update({
        menu_item_ids: menuItemIds,
        pickup_date: pickupDate,
        pickup_start_time: pickupStartTime,
        pickup_end_time: pickupEndTime,
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("weekly_menus").insert({
      week_start_date: weekStartDate,
      menu_item_ids: menuItemIds,
      pickup_date: pickupDate,
      pickup_start_time: pickupStartTime,
      pickup_end_time: pickupEndTime,
      is_published: true,
      published_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  const { data: existingMenu } = await supabase
    .from("weekly_menus")
    .select("id")
    .eq("week_start_date", weekStartDate)
    .single();
  const weeklyMenuId = existingMenu!.id as string;

  if (pickupDate) {
    await syncStockLimits(supabase, weeklyMenuId, menuItemIds, pickupDate);
  }

  revalidatePath("/admin/menu");
  revalidatePath("/");
}

async function syncStockLimits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  weeklyMenuId: string,
  menuItemIds: string[],
  pickupDate: string
) {
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, max_limit")
    .in("id", menuItemIds.length > 0 ? menuItemIds : [""]);

  // Scoped to this pickup date, not just the weekly menu: republishing the
  // same week's row with a new pickup date must start a fresh counter
  // rather than carrying over the previous pickup date's orders/stock.
  const { data: existingLimits } = await supabase
    .from("stock_limits")
    .select("id, menu_item_id, stock_limit")
    .eq("weekly_menu_id", weeklyMenuId)
    .eq("pickup_date", pickupDate);

  const existingByItem = new Map((existingLimits ?? []).map((s) => [s.menu_item_id, s]));

  // Ground truth for how much of each item has actually been ordered so far
  // for this pickup date, used to recompute current_stock whenever the admin
  // changes stock_limit — the running current_stock counter must never be
  // left stale relative to it.
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("order_items")
    .eq("weekly_menu_id", weeklyMenuId)
    .eq("pickup_date", pickupDate);

  const consumedByItem = new Map<string, number>();
  for (const order of existingOrders ?? []) {
    for (const orderItem of order.order_items as { item_id: string; quantity: number }[]) {
      consumedByItem.set(
        orderItem.item_id,
        (consumedByItem.get(orderItem.item_id) ?? 0) + orderItem.quantity
      );
    }
  }

  for (const item of items ?? []) {
    const existing = existingByItem.get(item.id);
    if (item.max_limit == null) {
      if (existing) {
        await supabase.from("stock_limits").delete().eq("id", existing.id);
      }
      continue;
    }
    if (!existing) {
      const consumed = consumedByItem.get(item.id) ?? 0;
      await supabase.from("stock_limits").insert({
        weekly_menu_id: weeklyMenuId,
        menu_item_id: item.id,
        pickup_date: pickupDate,
        stock_limit: item.max_limit,
        current_stock: Math.max(item.max_limit - consumed, 0),
      });
    } else if (existing.stock_limit !== item.max_limit) {
      const consumed = consumedByItem.get(item.id) ?? 0;
      await supabase
        .from("stock_limits")
        .update({
          stock_limit: item.max_limit,
          current_stock: Math.max(item.max_limit - consumed, 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
  }
}

export async function setFormOpen(weeklyMenuId: string, open: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("weekly_menus")
    .update({ form_open: open, updated_at: new Date().toISOString() })
    .eq("id", weeklyMenuId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/form-settings");
  revalidatePath("/");
}

export async function setAnnouncement(weeklyMenuId: string, message: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("weekly_menus")
    .update({ announcement_message: message || null, updated_at: new Date().toISOString() })
    .eq("id", weeklyMenuId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/form-settings");
  revalidatePath("/");
}
