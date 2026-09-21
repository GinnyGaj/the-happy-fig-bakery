import type { MenuItem, Order, RecipeIngredient } from "@/lib/types";

export interface IngredientRequirement {
  inventoryItemId: string;
  name: string;
  unit: string;
  totalQuantity: number;
}

export interface UnmappedMenuItem {
  itemId: string;
  name: string;
  orderedQty: number;
}

export interface MenuItemBreakdown {
  itemId: string;
  itemName: string;
  orderedQty: number;
  ingredients: IngredientRequirement[];
}

export interface IngredientRequirementsResult {
  requirements: IngredientRequirement[];
  byMenuItem: MenuItemBreakdown[];
  unmappedMenuItems: UnmappedMenuItem[];
}

export type MenuItemRecipeMap = Map<
  string,
  { recipeId: string; baseYieldQty: number | null }
>;

export type RecipeIngredientsMap = Map<
  string,
  (RecipeIngredient & { inventory_items: { name: string; unit: string } })[]
>;

export function computeIngredientRequirements(
  orders: Order[],
  menuItemRecipeMap: MenuItemRecipeMap,
  recipeIngredientsMap: RecipeIngredientsMap,
  menuItemsById: Map<string, MenuItem>
): IngredientRequirementsResult {
  const orderedQtyByItem = new Map<string, number>();
  for (const order of orders) {
    for (const orderItem of order.order_items) {
      orderedQtyByItem.set(
        orderItem.item_id,
        (orderedQtyByItem.get(orderItem.item_id) ?? 0) + orderItem.quantity
      );
    }
  }

  const byMenuItem: MenuItemBreakdown[] = [];
  const unmappedMenuItems: UnmappedMenuItem[] = [];
  const totalsByInventoryItem = new Map<string, IngredientRequirement>();

  for (const [itemId, orderedQty] of orderedQtyByItem) {
    const itemName = menuItemsById.get(itemId)?.name ?? itemId;
    const mapping = menuItemRecipeMap.get(itemId);
    const recipeIngredients = mapping ? recipeIngredientsMap.get(mapping.recipeId) : undefined;

    if (!mapping || !mapping.baseYieldQty || mapping.baseYieldQty <= 0 || !recipeIngredients) {
      unmappedMenuItems.push({ itemId, name: itemName, orderedQty });
      continue;
    }

    const scaleFactor = orderedQty / mapping.baseYieldQty;
    const ingredients: IngredientRequirement[] = recipeIngredients.map((ingredient) => ({
      inventoryItemId: ingredient.inventory_item_id,
      name: ingredient.inventory_items.name,
      unit: ingredient.inventory_items.unit,
      totalQuantity: ingredient.base_weight_grams * scaleFactor,
    }));

    byMenuItem.push({ itemId, itemName, orderedQty, ingredients });

    for (const ingredient of ingredients) {
      const existing = totalsByInventoryItem.get(ingredient.inventoryItemId);
      if (existing) {
        existing.totalQuantity += ingredient.totalQuantity;
      } else {
        totalsByInventoryItem.set(ingredient.inventoryItemId, { ...ingredient });
      }
    }
  }

  const requirements = Array.from(totalsByInventoryItem.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return { requirements, byMenuItem, unmappedMenuItems };
}
