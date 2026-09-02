"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InventoryCategory, InventoryUnit } from "@/lib/types";

export async function createInventoryItem(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("inventory_items").insert({
    name: formData.get("name") as string,
    category: formData.get("category") as InventoryCategory,
    unit: formData.get("unit") as InventoryUnit,
    low_stock_threshold: Number(formData.get("low_stock_threshold") || 0),
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
}

export async function updateInventoryItem(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("inventory_items")
    .update({
      name: formData.get("name") as string,
      category: formData.get("category") as InventoryCategory,
      unit: formData.get("unit") as InventoryUnit,
      low_stock_threshold: Number(formData.get("low_stock_threshold") || 0),
      notes: (formData.get("notes") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
}

// Logs one shopping trip: a parent `expenses` row, one `expense_items` child
// row per item on the receipt, and one `inventory_batches` row per item
// (created via the `add_inventory_batch` RPC so batch bookkeeping stays in
// one place alongside `post_bake_audit`'s FIFO logic).
export async function logPurchase(formData: FormData) {
  const supabase = await createClient();

  const itemIds = formData.getAll("item_id") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const costs = formData.getAll("cost") as string[];
  const expiryDates = formData.getAll("expiry_date") as string[];

  if (itemIds.length === 0) {
    throw new Error("Add at least one item to the purchase.");
  }

  const totalCost = costs.reduce((sum, c) => sum + (Number(c) || 0), 0);

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      expense_date: formData.get("expense_date") as string,
      vendor: (formData.get("vendor") as string) || null,
      total_cost: totalCost,
      receipt_photo_path: (formData.get("receipt_photo_path") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single();

  if (expenseError) throw new Error(expenseError.message);

  for (let i = 0; i < itemIds.length; i++) {
    const itemId = itemIds[i];
    const quantity = Number(quantities[i]);
    const cost = Number(costs[i] || 0);
    const expiryDate = expiryDates[i] || null;

    const { data: batchId, error: batchError } = await supabase.rpc("add_inventory_batch", {
      p_inventory_item_id: itemId,
      p_expense_id: expense.id,
      p_quantity: quantity,
      p_unit_cost: quantity > 0 ? cost / quantity : null,
      p_purchase_date: formData.get("expense_date") as string,
      p_expiry_date: expiryDate,
    });

    if (batchError) throw new Error(batchError.message);

    const { error: expenseItemError } = await supabase.from("expense_items").insert({
      expense_id: expense.id,
      inventory_item_id: itemId,
      inventory_batch_id: batchId as string,
      quantity,
      cost,
    });

    if (expenseItemError) throw new Error(expenseItemError.message);
  }

  revalidatePath("/admin/inventory");
}

export async function runPostBakeAudit(
  itemId: string,
  newTotal: number,
  notes?: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("post_bake_audit", {
    p_inventory_item_id: itemId,
    p_new_total: newTotal,
    p_notes: notes || null,
  });

  if (error) {
    if (error.message.includes("NEW_TOTAL_EXCEEDS_STOCK")) {
      return { error: "That total is higher than the current stock on hand." };
    }
    console.error("runPostBakeAudit failed:", error);
    return { error: "Something went wrong recording the audit. Please try again." };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/audit");
  return {};
}
