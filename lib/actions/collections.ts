"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { PaymentMethod } from "@/lib/types";

const markCollectedSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(["cash", "card", "free"]),
  collectedBy: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function markOrderCollected(input: {
  orderId: string;
  paymentMethod: PaymentMethod;
  collectedBy?: string;
  notes?: string;
}): Promise<{ error?: string }> {
  const parsed = markCollectedSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the collection details and try again." };
  }
  const { orderId, paymentMethod, collectedBy, notes } = parsed.data;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status: "collected",
      payment_method: paymentMethod,
      collected_at: new Date().toISOString(),
      collected_by: collectedBy || null,
      collection_notes: notes || null,
    })
    .eq("id", orderId);

  if (error) {
    console.error("markOrderCollected failed:", error);
    return { error: "Something went wrong recording the collection. Please try again." };
  }

  return {};
}

export async function unmarkOrderCollected(orderId: string): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order id." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status: "pending",
      payment_method: null,
      collected_at: null,
      collected_by: null,
      collection_notes: null,
    })
    .eq("id", parsed.data);

  if (error) {
    console.error("unmarkOrderCollected failed:", error);
    return { error: "Something went wrong undoing the collection. Please try again." };
  }

  return {};
}

export async function setOrderComingLater(
  orderId: string,
  comingLater: boolean
): Promise<{ error?: string }> {
  const parsed = z.string().uuid().safeParse(orderId);
  if (!parsed.success) {
    return { error: "Invalid order id." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("orders")
    .update({ coming_later: comingLater })
    .eq("id", parsed.data);

  if (error) {
    console.error("setOrderComingLater failed:", error);
    return { error: "Something went wrong updating the order. Please try again." };
  }

  return {};
}

const upsertMadeQuantitySchema = z.object({
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  itemName: z.string().trim().min(1),
  madeQuantity: z.number().int().min(0),
});

export async function upsertMadeQuantity(input: {
  pickupDate: string;
  itemName: string;
  madeQuantity: number;
}): Promise<{ error?: string }> {
  const parsed = upsertMadeQuantitySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please enter a valid made quantity." };
  }
  const { pickupDate, itemName, madeQuantity } = parsed.data;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("daily_made_quantities")
    .upsert(
      {
        pickup_date: pickupDate,
        item_name: itemName,
        made_quantity: madeQuantity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "pickup_date,item_name" }
    );

  if (error) {
    console.error("upsertMadeQuantity failed:", error);
    return { error: "Something went wrong saving the made quantity. Please try again." };
  }

  return {};
}
