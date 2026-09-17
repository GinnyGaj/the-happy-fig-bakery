"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { OrderItem } from "@/lib/types";

const orderSchema = z.object({
  weeklyMenuId: z.string().uuid(),
  firstName: z.string().trim().min(1, "Please tell us your first name."),
  lastName: z.string().trim().min(1, "Please tell us your last name."),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\+44|0)[0-9\s]{9,13}$/, "Please enter a valid UK WhatsApp number."),
  specialInstructions: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        item_id: z.string().uuid(),
        name: z.string(),
        quantity: z.number().int().min(1),
        price: z.number(),
      })
    )
    .min(1, "Please choose at least one bake."),
});

export interface PlaceOrderState {
  error?: string;
  fieldErrors?: Record<string, string>;
  orderId?: string;
}

const FREE_BAKE_UNLOCK_THRESHOLD = 3;

export async function placeOrder(
  input: unknown
): Promise<PlaceOrderState> {
  const parsed = orderSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      fieldErrors[key] = issue.message;
    }
    return { error: "Please check the form and try again.", fieldErrors };
  }

  const { weeklyMenuId, firstName, lastName, whatsapp, specialInstructions, items } =
    parsed.data;

  const supabase = createServiceClient();

  const { data: menuItems, error: menuItemsError } = await supabase
    .from("menu_items")
    .select("id, is_free_item")
    .in(
      "id",
      items.map((i) => i.item_id)
    );

  if (menuItemsError) {
    console.error("placeOrder failed to load menu items:", menuItemsError);
    return { error: "Something went wrong placing your order. Please try again." };
  }

  const freeItemIds = new Set(
    (menuItems ?? []).filter((m) => m.is_free_item).map((m) => m.id)
  );
  const paidQty = items.reduce(
    (sum, i) => (freeItemIds.has(i.item_id) ? sum : sum + i.quantity),
    0
  );
  const hasFreeItem = items.some((i) => freeItemIds.has(i.item_id));

  if (hasFreeItem && paidQty < FREE_BAKE_UNLOCK_THRESHOLD) {
    return {
      error: `Your free test bake requires at least ${FREE_BAKE_UNLOCK_THRESHOLD} other items in your order.`,
    };
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const { data, error } = await supabase
    .rpc("place_order", {
      p_weekly_menu_id: weeklyMenuId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_whatsapp: whatsapp,
      p_special_instructions: specialInstructions || null,
      p_items: items satisfies OrderItem[],
      p_subtotal: subtotal,
    })
    .single();

  if (error) {
    const soldOut = error.message.match(/SOLD_OUT:(.*)/);
    if (soldOut) {
      return {
        error: `Sorry, ${soldOut[1]} just sold out. Please update your order.`,
      };
    }
    console.error("placeOrder failed:", error);
    return { error: "Something went wrong placing your order. Please try again." };
  }

  return { orderId: data as string };
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order id." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc("delete_order", { p_order_id: parsed.data });

  if (error) {
    console.error("deleteOrder failed:", error);
    return { error: "Something went wrong deleting the order. Please try again." };
  }

  return {};
}

export async function markReminderSent(orderId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order id." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ reminder_sent: true })
    .eq("id", parsed.data);

  if (error) {
    console.error("markReminderSent failed:", error);
    return { error: "Something went wrong updating reminder status." };
  }

  return {};
}
