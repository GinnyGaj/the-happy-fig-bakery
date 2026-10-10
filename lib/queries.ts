import { createClient } from "@/lib/supabase/server";
import { currentWeekStart } from "@/lib/utils";
import type { MenuItem, Order, WeeklyMenu, StockLimit, DailyMadeQuantity } from "@/lib/types";

// The menu customers currently see on the order page. Admin controls that
// affect the live form (open/close, announcement) must target this row, not
// the calendar week — the week rolls over on Saturday, before Sunday pickup.
export async function getLatestPublishedMenu(): Promise<WeeklyMenu | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("is_published", true)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as WeeklyMenu | null) ?? null;
}

const priorityOrder = [
  "honey & feta swirls",
  "rosemary focaccia",
  "chocolate chip cookie",
  "spiced samosa",
];
const priorityRank = (name: string) => {
  const index = priorityOrder.indexOf(name.trim().toLowerCase());
  return index === -1 ? priorityOrder.length : index;
};

export async function getCurrentWeeklyMenu(): Promise<{
  weeklyMenu: WeeklyMenu | null;
  items: MenuItem[];
  stock: StockLimit[];
}> {
  const supabase = await createClient();

  const weeklyMenu = await getLatestPublishedMenu();

  if (!weeklyMenu) {
    return { weeklyMenu: null, items: [], stock: [] };
  }

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .in("id", weeklyMenu.menu_item_ids ?? []);

  const stockQuery = supabase
    .from("stock_limits")
    .select("*")
    .eq("weekly_menu_id", weeklyMenu.id);
  if (weeklyMenu.pickup_date) {
    stockQuery.eq("pickup_date", weeklyMenu.pickup_date);
  }
  const { data: stock } = await stockQuery;

  const menuItemIds = weeklyMenu.menu_item_ids ?? [];
  const idOrder = new Map<string, number>(
    (menuItemIds as string[]).map((id, index) => [id, index])
  );

  const sortedItems = ((items ?? []) as MenuItem[]).sort((a, b) => {
    const priorityDiff = priorityRank(a.name) - priorityRank(b.name);
    if (priorityDiff !== 0) return priorityDiff;

    const freeDiff = Number(a.is_free_item) - Number(b.is_free_item);
    if (freeDiff !== 0) return freeDiff;

    return (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0);
  });

  return {
    weeklyMenu,
    items: sortedItems,
    stock: (stock ?? []) as StockLimit[],
  };
}

// Everything we bake, shown to customers while pre-ordering is closed so they
// can see our full range. Free test bakes are one-offs, so they're left out.
export async function getFullMenu(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_free_item", false)
    .order("name", { ascending: true });
  return ((data ?? []) as MenuItem[]).sort(
    (a, b) => priorityRank(a.name) - priorityRank(b.name)
  );
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as MenuItem[];
}

export async function getOrCreateThisWeeksMenu(): Promise<WeeklyMenu> {
  const supabase = await createClient();
  const weekStart = currentWeekStart();

  const { data: existing, error: selectError } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("week_start_date", weekStart)
    .maybeSingle();

  if (selectError) throw new Error(`Failed to fetch weekly menu: ${selectError.message}`);
  if (existing) return existing as WeeklyMenu;

  const { data: created, error: insertError } = await supabase
    .from("weekly_menus")
    .insert({ week_start_date: weekStart })
    .select("*")
    .single();

  if (insertError) {
    // Another concurrent request may have inserted this week's row first
    // (week_start_date is unique) — fall back to reading it instead of failing.
    const { data: raceWinner, error: retryError } = await supabase
      .from("weekly_menus")
      .select("*")
      .eq("week_start_date", weekStart)
      .single();

    if (retryError || !raceWinner) {
      throw new Error(`Failed to create weekly menu: ${insertError.message}`);
    }
    return raceWinner as WeeklyMenu;
  }

  if (!created) throw new Error("Failed to create weekly menu: no row returned");
  return created as WeeklyMenu;
}

export async function getAllOrders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOrdersByPickupDateRange(start: string, end: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .gte("pickup_date", start)
    .lte("pickup_date", end)
    .order("pickup_date", { ascending: true });
  return (data ?? []) as Order[];
}

export async function getOrdersForWeek(weeklyMenuId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("weekly_menu_id", weeklyMenuId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOrdersForPickupDate(pickupDate: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("pickup_date", pickupDate)
    .order("created_at", { ascending: true });
  return (data ?? []) as Order[];
}

export async function getDistinctPickupDates(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("pickup_date")
    .order("pickup_date", { ascending: false });
  const unique = Array.from(new Set((data ?? []).map((row) => row.pickup_date as string)));
  return unique;
}

export async function getMadeQuantitiesForPickupDate(
  pickupDate: string
): Promise<DailyMadeQuantity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_made_quantities")
    .select("*")
    .eq("pickup_date", pickupDate);
  return (data ?? []) as DailyMadeQuantity[];
}
