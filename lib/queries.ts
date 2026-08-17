import { createClient } from "@/lib/supabase/server";
import { currentWeekStart } from "@/lib/utils";
import type { MenuItem, WeeklyMenu, StockLimit } from "@/lib/types";

export async function getCurrentWeeklyMenu(): Promise<{
  weeklyMenu: WeeklyMenu | null;
  items: MenuItem[];
  stock: StockLimit[];
}> {
  const supabase = await createClient();

  const { data: weeklyMenu } = await supabase
    .from("weekly_menus")
    .select("*")
    .eq("is_published", true)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!weeklyMenu) {
    return { weeklyMenu: null, items: [], stock: [] };
  }

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .in("id", weeklyMenu.menu_item_ids ?? []);

  const { data: stock } = await supabase
    .from("stock_limits")
    .select("*")
    .eq("weekly_menu_id", weeklyMenu.id);

  return {
    weeklyMenu: weeklyMenu as WeeklyMenu,
    items: (items ?? []) as MenuItem[],
    stock: (stock ?? []) as StockLimit[],
  };
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

export async function getOrdersForWeek(weeklyMenuId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("weekly_menu_id", weeklyMenuId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
