import ExcelJS from "exceljs";
import { notFound } from "next/navigation";
import { getRecipe, getRecipeIngredients, getRecipeSections, getRecipeSteps } from "@/lib/recipe-queries";
import type { RecipeStage } from "@/lib/types";

const STAGE_LABELS: Record<RecipeStage, string> = {
  pre_prep: "Pre-prep",
  prep: "Prep",
  bake: "Bake",
};
const STAGE_ORDER: RecipeStage[] = ["pre_prep", "prep", "bake"];

export async function GET(request: Request, { params }: RouteContext<"/admin/recipes/[id]/download">) {
  const { id } = await params;
  const target = new URL(request.url).searchParams.get("target");

  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const targetYield = target != null ? Number(target) : NaN;
  const scaleFactor =
    !Number.isNaN(targetYield) && targetYield > 0 && recipe.base_yield_qty != null && recipe.base_yield_qty > 0
      ? targetYield / recipe.base_yield_qty
      : null;

  const [ingredients, sections, steps] = await Promise.all([
    getRecipeIngredients(id),
    getRecipeSections(id),
    getRecipeSteps(id),
  ]);
  const ungroupedIngredients = ingredients.filter((ingredient) => !ingredient.section_id);
  const ingredientGroups = [
    ...(ungroupedIngredients.length > 0 ? [{ name: null as string | null, ingredients: ungroupedIngredients }] : []),
    ...sections.map((section) => ({
      name: section.name,
      ingredients: ingredients.filter((ingredient) => ingredient.section_id === section.id),
    })),
  ];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(recipe.name.slice(0, 31) || "Recipe");
  sheet.columns = [{ width: 32 }, { width: 14 }, { width: 14 }];

  sheet.addRow([recipe.name]).font = { bold: true, size: 14 };
  if (scaleFactor != null) {
    sheet.addRow([`Scaled to ${targetYield} ${recipe.base_yield_unit ?? ""}`.trim()]);
    sheet.addRow([`(base recipe yields ${recipe.base_yield_qty} ${recipe.base_yield_unit ?? ""})`.trim()]);
  } else if (recipe.base_yield_qty != null) {
    sheet.addRow([`Yields ${recipe.base_yield_qty} ${recipe.base_yield_unit ?? ""}`.trim()]);
  }
  sheet.addRow([]);

  sheet.addRow(["Ingredients"]).font = { bold: true };
  const headerRow = sheet.addRow(["Ingredient", "Weight (g)", "Baker's %"]);
  headerRow.font = { bold: true };
  for (const group of ingredientGroups) {
    if (group.name) {
      sheet.addRow([group.name]).font = { italic: true };
    }
    for (const ingredient of group.ingredients) {
      const weight = scaleFactor != null ? ingredient.base_weight_grams * scaleFactor : ingredient.base_weight_grams;
      sheet.addRow([
        ingredient.inventory_items.name,
        Number(weight.toFixed(1)),
        Number(ingredient.bakers_percent.toFixed(1)),
      ]);
    }
  }
  if (ingredients.length === 0) {
    sheet.addRow(["No ingredients added."]);
  }

  sheet.addRow([]);
  sheet.addRow(["Method"]).font = { bold: true };
  for (const stage of STAGE_ORDER) {
    const stageSteps = steps.filter((step) => step.stage === stage);
    if (stageSteps.length === 0) continue;
    sheet.addRow([STAGE_LABELS[stage]]).font = { bold: true };
    for (const step of stageSteps) {
      sheet.addRow([`${step.step_number}. ${step.instruction}`]);
    }
  }
  if (steps.length === 0) {
    sheet.addRow(["No steps added."]);
  }

  if (recipe.tips_notes) {
    sheet.addRow([]);
    sheet.addRow(["Tips / notes"]).font = { bold: true };
    sheet.addRow([recipe.tips_notes]);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const suffix = scaleFactor != null ? `_scaled_${targetYield}` : "";
  const filename = `${recipe.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}${suffix}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
