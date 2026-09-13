import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeIngredient, RecipeStep } from "@/lib/types";

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

export async function getRecipeSteps(recipeId: string): Promise<RecipeStep[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipe_steps")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("step_number", { ascending: true });
  return (data ?? []) as RecipeStep[];
}
