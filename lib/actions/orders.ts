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
