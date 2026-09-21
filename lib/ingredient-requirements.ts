import type { MenuItem, Order, RecipeIngredient } from "@/lib/types";

export interface IngredientRequirement {
  inventoryItemId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  onHand: number;
  surplusOrDeficit: number;
  isLowStock: boolean;
}

/** Attention threshold: flag anything below required + 10% buffer. */
const STOCK_BUFFER = 1.1;

function withStock(
  item: { inventoryItemId: string; name: string; unit: string; totalQuantity: number },
  stockByItemId: Map<string, number>
): IngredientRequirement {
  const onHand = stockByItemId.get(item.inventoryItemId) ?? 0;
  return {
    ...item,
    onHand,
    surplusOrDeficit: onHand - item.totalQuantity,
    isLowStock: onHand < item.totalQuantity * STOCK_BUFFER,
  };
}

export type UnmappedReason = "no_recipe_linked" | "missing_base_yield" | "no_recipe_ingredients";

export interface UnmappedMenuItem {
  itemId: string;
  name: string;
  orderedQty: number;
  reason: UnmappedReason;
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
  menuItemsById: Map<string, MenuItem>,
  stockByItemId: Map<string, number> = new Map()
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

    if (!mapping) {
      unmappedMenuItems.push({ itemId, name: itemName, orderedQty, reason: "no_recipe_linked" });
      continue;
    }

    if (!mapping.baseYieldQty || mapping.baseYieldQty <= 0) {
      unmappedMenuItems.push({ itemId, name: itemName, orderedQty, reason: "missing_base_yield" });
      continue;
    }

    if (!recipeIngredients) {
      unmappedMenuItems.push({ itemId, name: itemName, orderedQty, reason: "no_recipe_ingredients" });
      continue;
    }

    const scaleFactor = orderedQty / mapping.baseYieldQty;
    const ingredients: IngredientRequirement[] = recipeIngredients.map((ingredient) =>
      withStock(
        {
          inventoryItemId: ingredient.inventory_item_id,
          name: ingredient.inventory_items.name,
          unit: ingredient.inventory_items.unit,
          totalQuantity: ingredient.base_weight_grams * scaleFactor,
        },
        stockByItemId
      )
    );

    byMenuItem.push({ itemId, itemName, orderedQty, ingredients });

    for (const ingredient of ingredients) {
      const existing = totalsByInventoryItem.get(ingredient.inventoryItemId);
      if (existing) {
        existing.totalQuantity += ingredient.totalQuantity;
      } else {
        totalsByInventoryItem.set(ingredient.inventoryItemId, { ...ingredient, totalQuantity: ingredient.totalQuantity });
      }
    }
  }

  const requirements = Array.from(totalsByInventoryItem.values())
    .map((item) => withStock(item, stockByItemId))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { requirements, byMenuItem, unmappedMenuItems };
}
