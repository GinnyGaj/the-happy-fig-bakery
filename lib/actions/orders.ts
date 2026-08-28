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

  const { data: stockRows } = await supabase
    .from("stock_limits")
    .select("menu_item_id, current_stock")
    .eq("weekly_menu_id", weeklyMenuId)
    .in(
      "menu_item_id",
      items.map((i) => i.item_id)
    );

  const stockByItem = new Map((stockRows ?? []).map((s) => [s.menu_item_id, s.current_stock]));

  for (const item of items) {
    const available = stockByItem.get(item.item_id);
    if (available != null && item.quantity > available) {
      return {
        error: `Sorry, ${item.name} just sold out. Please update your order.`,
      };
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      weekly_menu_id: weeklyMenuId,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_whatsapp: whatsapp,
      order_items: items satisfies OrderItem[],
      order_subtotal: subtotal,
      special_instructions: specialInstructions || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("placeOrder insert failed:", error);
    return { error: "Something went wrong placing your order. Please try again." };
  }

  for (const item of items) {
    await supabase.rpc("decrement_stock", {
      p_weekly_menu_id: weeklyMenuId,
      p_menu_item_id: item.item_id,
      p_quantity: item.quantity,
    });
  }

  return { orderId: data.id };
}

export async function deleteOrder(orderId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order id." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("orders").delete().eq("id", parsed.data);

  if (error) {
    console.error("deleteOrder failed:", error);
    return { error: "Something went wrong deleting the order. Please try again." };
  }

  return {};
}
