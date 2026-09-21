import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeIngredient, RecipeSection, RecipeStep } from "@/lib/types";

export async function getAllRecipes(): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .order("name", { ascending: true });
  return (data ?? []) as Recipe[];
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("recipes").select("*").eq("id", id).single();
  return (data as Recipe) ?? null;
}

export async function getRecipeIngredients(
  recipeId: string
): Promise<(RecipeIngredient & { inventory_items: { name: string; unit: string } })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_ingredients")
    .select("*, inventory_items(name, unit)")
    .eq("recipe_id", recipeId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as (RecipeIngredient & { inventory_items: { name: string; unit: string } })[];
}

export async function getRecipeIngredientsForRecipes(
  recipeIds: string[]
): Promise<Map<string, (RecipeIngredient & { inventory_items: { name: string; unit: string } })[]>> {
  const map = new Map<
    string,
    (RecipeIngredient & { inventory_items: { name: string; unit: string } })[]
  >();
  if (recipeIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_ingredients")
    .select("*, inventory_items(name, unit)")
    .in("recipe_id", recipeIds)
    .order("sort_order", { ascending: true });

  for (const row of (data ?? []) as (RecipeIngredient & {
    inventory_items: { name: string; unit: string };
  })[]) {
    const existing = map.get(row.recipe_id);
    if (existing) existing.push(row);
    else map.set(row.recipe_id, [row]);
  }
  return map;
}

export async function getRecipeSections(recipeId: string): Promise<RecipeSection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_sections")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as RecipeSection[];
}

export async function getRecipeSteps(recipeId: string): Promise<RecipeStep[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_steps")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("step_number", { ascending: true });
  return (data ?? []) as RecipeStep[];
}
