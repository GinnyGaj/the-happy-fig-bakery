"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DietaryTag } from "@/lib/types";

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
      updated_at: new Date().toISOString(),
    })
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

  revalidatePath("/admin/menu");
  revalidatePath("/");
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
