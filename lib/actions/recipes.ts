"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RecipeStage, RecipeStatus } from "@/lib/types";

// One ingredient row as submitted from the Add Recipe form.
interface IngredientInput {
  inventory_item_id: string;
  base_weight_grams: number;
}

// One step row as submitted from the Add Recipe form.
interface StepInput {
  stage: RecipeStage;
  instruction: string;
}

function parseIngredients(formData: FormData): IngredientInput[] {
  const itemIds = formData.getAll("ingredient_item_id") as string[];
  const weights = formData.getAll("ingredient_weight_grams") as string[];

  return itemIds
    .map((inventory_item_id, i) => ({
      inventory_item_id,
      base_weight_grams: Number(weights[i]),
    }))
    .filter((row) => row.inventory_item_id && row.base_weight_grams > 0);
}

function parseSteps(formData: FormData): StepInput[] {
  const stages = formData.getAll("step_stage") as RecipeStage[];
  const instructions = formData.getAll("step_instruction") as string[];

  return stages
    .map((stage, i) => ({ stage, instruction: instructions[i]?.trim() ?? "" }))
    .filter((row) => row.instruction.length > 0);
}

// Baker's percentage is expressed relative to total flour weight; recipes
// with no ingredient tagged as flour just show 0% for every row.
function computeBakersPercents(ingredients: IngredientInput[], flourItemIds: Set<string>) {
  const flourTotal = ingredients
    .filter((i) => flourItemIds.has(i.inventory_item_id))
    .reduce((sum, i) => sum + i.base_weight_grams, 0);

  return ingredients.map((i) => ({
    ...i,
    bakers_percent: flourTotal > 0 ? (i.base_weight_grams / flourTotal) * 100 : 0,
  }));
}

export async function createRecipe(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Recipe name is required.");

  const ingredients = parseIngredients(formData);
  const steps = parseSteps(formData);

  // Baker's % basis: any ingredient whose name contains "flour" counts
  // toward the 100% total, matching the plan's flour-as-basis convention.
  let flourItemIds = new Set<string>();
  if (ingredients.length > 0) {
    const { data: items } = await supabase
      .from("inventory_items")
      .select("id, name")
      .in(
        "id",
        ingredients.map((i) => i.inventory_item_id)
      );
    flourItemIds = new Set(
      (items ?? []).filter((i) => i.name.toLowerCase().includes("flour")).map((i) => i.id)
    );
  }
  const ingredientsWithPercent = computeBakersPercents(ingredients, flourItemIds);

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      name: name.trim(),
      status: (formData.get("status") as RecipeStatus) || "draft",
      base_yield_qty: formData.get("base_yield_qty") ? Number(formData.get("base_yield_qty")) : null,
      base_yield_unit: (formData.get("base_yield_unit") as string) || null,
      tips_notes: (formData.get("tips_notes") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (ingredientsWithPercent.length > 0) {
    const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(
      ingredientsWithPercent.map((ingredient, index) => ({
        recipe_id: recipe.id,
        inventory_item_id: ingredient.inventory_item_id,
        base_weight_grams: ingredient.base_weight_grams,
        bakers_percent: ingredient.bakers_percent,
        sort_order: index,
      }))
    );
    if (ingredientsError) throw new Error(ingredientsError.message);
  }

  if (steps.length > 0) {
    const stageCounters: Record<RecipeStage, number> = { pre_prep: 0, prep: 0, bake: 0 };
    const { error: stepsError } = await supabase.from("recipe_steps").insert(
      steps.map((step) => ({
        recipe_id: recipe.id,
        stage: step.stage,
        step_number: ++stageCounters[step.stage],
        instruction: step.instruction,
      }))
    );
    if (stepsError) throw new Error(stepsError.message);
  }

  revalidatePath("/admin/recipes");
  redirect(`/admin/recipes/${recipe.id}`);
}
