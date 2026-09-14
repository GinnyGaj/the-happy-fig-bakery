"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RecipeStage, RecipeStatus } from "@/lib/types";

// One ingredient row as submitted from the Add Recipe form. section_index
// refers to the position in the section_name[] array, or -1 if ungrouped.
interface IngredientInput {
  inventory_item_id: string;
  base_weight_grams: number;
  section_index: number;
  is_percent_base: boolean;
}

// One step row as submitted from the Add Recipe form.
interface StepInput {
  stage: RecipeStage;
  instruction: string;
}

function parseSections(formData: FormData): string[] {
  return (formData.getAll("section_name") as string[]).map((name) => name.trim());
}

function parseIngredients(formData: FormData): IngredientInput[] {
  const itemIds = formData.getAll("ingredient_item_id") as string[];
  const weights = formData.getAll("ingredient_weight_grams") as string[];
  const sectionIndexes = formData.getAll("ingredient_section_index") as string[];
  const keys = formData.getAll("ingredient_key") as string[];
  const baseKey = formData.get("ingredient_is_base") as string | null;

  return itemIds
    .map((inventory_item_id, i) => ({
      inventory_item_id,
      base_weight_grams: Number(weights[i]),
      section_index: sectionIndexes[i] !== "" ? Number(sectionIndexes[i]) : -1,
      is_percent_base: baseKey !== null && keys[i] === baseKey,
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

// Baker's percentage is expressed relative to the weight of the single
// ingredient the admin chose as the 100% basis. Recipes with no ingredient
// marked as the basis just show 0% for every row.
function computeBakersPercents(ingredients: IngredientInput[]) {
  const baseTotal = ingredients
    .filter((i) => i.is_percent_base)
    .reduce((sum, i) => sum + i.base_weight_grams, 0);

  return ingredients.map((i) => ({
    ...i,
    bakers_percent: baseTotal > 0 ? (i.base_weight_grams / baseTotal) * 100 : 0,
  }));
}

export async function createRecipe(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Recipe name is required.");

  const sectionNames = parseSections(formData);
  const ingredients = parseIngredients(formData);
  const steps = parseSteps(formData);

  if (ingredients.length > 0 && !ingredients.some((i) => i.is_percent_base)) {
    throw new Error("Choose one ingredient as the 100% baker's percentage base.");
  }

  const ingredientsWithPercent = computeBakersPercents(ingredients);

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

  // section_ids[i] is the recipe_sections.id for sectionNames[i].
  let sectionIds: string[] = [];
  if (sectionNames.length > 0) {
    const { data: sections, error: sectionsError } = await supabase
      .from("recipe_sections")
      .insert(
        sectionNames.map((sectionName, index) => ({
          recipe_id: recipe.id,
          name: sectionName || `Section ${index + 1}`,
          sort_order: index,
        }))
      )
      .select("id")
      .order("sort_order", { ascending: true });
    if (sectionsError) throw new Error(sectionsError.message);
    sectionIds = (sections ?? []).map((section) => section.id);
  }

  if (ingredientsWithPercent.length > 0) {
    const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(
      ingredientsWithPercent.map((ingredient, index) => ({
        recipe_id: recipe.id,
        section_id: sectionIds[ingredient.section_index] ?? null,
        inventory_item_id: ingredient.inventory_item_id,
        base_weight_grams: ingredient.base_weight_grams,
        bakers_percent: ingredient.bakers_percent,
        is_percent_base: ingredient.is_percent_base,
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
