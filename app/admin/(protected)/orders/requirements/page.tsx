import { getAllMenuItems, getOrdersByPickupDateRange } from "@/lib/queries";
import { getAllRecipes, getRecipeIngredientsForRecipes } from "@/lib/recipe-queries";
import { getInventoryWithStock } from "@/lib/inventory-queries";
import { computeIngredientRequirements } from "@/lib/ingredient-requirements";
import { RequirementsView } from "./RequirementsView";

export default async function IngredientRequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;

  const [menuItems, recipes, inventoryStock] = await Promise.all([
    getAllMenuItems(),
    getAllRecipes(),
    getInventoryWithStock(),
  ]);
  const stockByItemId = new Map(inventoryStock.map((s) => [s.inventory_item_id, s.current_stock]));
  const recipesById = new Map(recipes.map((r) => [r.id, r]));
  const menuItemsById = new Map(menuItems.map((m) => [m.id, m]));

  const menuItemRecipeMap = new Map(
    menuItems
      .filter((m) => m.recipe_id)
      .map((m) => [
        m.id,
        { recipeId: m.recipe_id as string, baseYieldQty: recipesById.get(m.recipe_id as string)?.base_yield_qty ?? null },
      ])
  );

  const orders = start && end ? await getOrdersByPickupDateRange(start, end) : [];

  const recipeIds = Array.from(new Set(Array.from(menuItemRecipeMap.values()).map((v) => v.recipeId)));
  const recipeIngredientsMap = await getRecipeIngredientsForRecipes(recipeIds);

  const result = orders.length
    ? computeIngredientRequirements(orders, menuItemRecipeMap, recipeIngredientsMap, menuItemsById, stockByItemId)
    : { requirements: [], byMenuItem: [], unmappedMenuItems: [] };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">Ingredient requirements</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a pickup-date range to see what ingredients are needed for that weekend&apos;s bake.
      </p>
      <RequirementsView start={start ?? ""} end={end ?? ""} result={result} hasSearched={Boolean(start && end)} />
    </div>
  );
}
