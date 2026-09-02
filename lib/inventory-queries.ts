import { createClient } from "@/lib/supabase/server";
import type {
  Expense,
  ExpenseItem,
  InventoryBatch,
  InventoryItem,
  InventoryStockStatus,
  InventoryUsageLog,
} from "@/lib/types";

export async function getInventoryWithStock(): Promise<InventoryStockStatus[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_stock_status")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as InventoryStockStatus[];
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_items")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as InventoryItem[];
}

export async function getAllBatches(): Promise<InventoryBatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_batches")
    .select("*")
    .order("purchase_date", { ascending: true });
  return (data ?? []) as InventoryBatch[];
}

export async function getBatchesForItem(itemId: string): Promise<InventoryBatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_batches")
    .select("*")
    .eq("inventory_item_id", itemId)
    .order("purchase_date", { ascending: true });
  return (data ?? []) as InventoryBatch[];
}

export async function getRecentExpenses(
  limit = 20
): Promise<(Expense & { expense_items: ExpenseItem[] })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("*, expense_items(*)")
    .order("expense_date", { ascending: false })
    .limit(limit);
  return (data ?? []) as (Expense & { expense_items: ExpenseItem[] })[];
}

export async function getUsageLogsForItem(
  itemId: string,
  limit = 10
): Promise<InventoryUsageLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_usage_logs")
    .select("*")
    .eq("inventory_item_id", itemId)
    .order("logged_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as InventoryUsageLog[];
}

export async function getSignedReceiptUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
