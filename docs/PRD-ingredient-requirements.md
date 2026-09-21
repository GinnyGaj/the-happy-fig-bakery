# PRD: Order → Recipe → Ingredient Requirements

**File name to reference during build:** `plan-for-this-problem-eventual-lemur.md`
(Consider copying this into the repo as `docs/PRD-ingredient-requirements.md` once approved, so it's version-controlled alongside the code it describes.)

## Context

Every Friday afternoon, after closing the pre-order form, the bakery owner manually cross-references all orders against recipes to figure out what ingredients (and how much of each) are needed for the weekend bake. This is slow and error-prone, especially since ingredients like flour are shared across multiple recipes and have to be manually totaled.

The admin portal already has Menu, Orders, Recipes, and Inventory tabs, each fully built independently, but **they don't talk to each other**: menu items are not linked to recipes, and there is no aggregation step. This PRD defines the feature that closes that loop for Phase 1 (MVP v0 + v1: compute "what ingredients do I need for these orders"), and documents Phase 2 (post-MVP: cross-reference against live inventory to get a shopping list) in detail so it isn't lost, even though it is explicitly **not** to be built now.

## Current State (from codebase research)

- `orders` table has a dedicated `pickup_date date` column (schema.sql:42-55) — separate from `created_at`. **Pickup date is the field to filter by**, per user decision (not order-placed date). Note: `OrdersTable.tsx` today filters by `created_at`, not `pickup_date` — this feature introduces the first pickup-date-based filter.
- `orders.order_items` is a JSONB array of `{ item_id, name, quantity, price }` (lib/types.ts:41-46). `item_id` refers to `menu_items.id` by convention (no FK, since it's inside JSONB).
- `recipes` (schema.sql:468-477) have `base_yield_qty` / `base_yield_unit` (e.g. "makes 12 swirls").
- `recipe_ingredients` (schema.sql:489-499) link each recipe to an `inventory_item_id` (FK into `inventory_items`) with a `base_weight_grams` for the recipe's base yield. Ingredients are **already structured** with quantities/units — confirmed, no data cleanup needed.
- `inventory_items` (schema.sql:258-268) have `name` and `unit` (g/kg/ml/l/count/tsp/tbsp/pack/roll/box).
- **Gap**: `menu_items` has no link to `recipes` at all. This is the one missing piece needed to walk Order → Menu Item → Recipe → Recipe Ingredients → Inventory Item.
- Scaling math precedent already exists: `ScaleRecipe.tsx` computes `scaleFactor = targetYield / baseYieldQty` then `ingredient.baseWeightGrams * scaleFactor`. Reuse this exact formula.
- Reusable UI precedents: date-range filter inputs and CSV export pattern both already exist in `OrdersTable.tsx`.
- Unit conversion is **out of scope** — ingredients are summed as-is per `inventory_item_id`/unit; the schema already keeps this consistent (one unit per inventory item).

## Phase 1 — MVP (build now)

### Data model change

Add a nullable FK column to link a menu item to the recipe that produces it:

```sql
alter table menu_items add column if not exists recipe_id uuid references recipes(id);
```

- One recipe per menu item is sufficient for MVP (matches the PDF's example: "25 honey feta swirls → honey feta swirl recipe"). If a menu item is later found to need multiple component recipes, that's a future enhancement, not part of this build.
- Menu items without a linked recipe should be visibly flagged in the requirements view (see below) rather than silently skipped, so gaps in linkage are obvious.
- **UI to set this link**: add a "Recipe" select field to the menu item edit form in `ItemLibrary.tsx` (`lib/actions/menu.ts` for the update action), populated from existing recipes.

### MVP v0 — Ingredient requirements for a date range, single combined list

**New page**: `app/admin/(protected)/orders/requirements/page.tsx` (or a new sub-tab/section reached from the Orders tab — placement TBD in review, but logically lives under Orders since it starts from "close the form and see what's needed").

Flow:
1. User picks a pickup-date range (reuse the two `<Input type="date">` From/To pattern from `OrdersTable.tsx:178-215`, but filter on `pickup_date`, not `created_at`).
2. User taps a "Show what's required" button.
3. System:
   - Fetches orders where `pickup_date` is within range (new query in `lib/queries.ts`, e.g. `getOrdersByPickupDateRange(start, end)`).
   - Sums `order_items[].quantity` per `item_id` across all matching orders → total ordered quantity per menu item.
   - For each menu item with a linked `recipe_id`: fetches `recipe_ingredients` for that recipe (reuse `getRecipeIngredients` pattern from `lib/recipe-queries.ts`), computes `scaleFactor = totalOrderedQty / recipe.base_yield_qty`, then `neededGrams = ingredient.base_weight_grams * scaleFactor` per ingredient.
   - Aggregates `neededGrams` across all recipes **by `inventory_item_id`** (this is the "flour needed for both cookies and honey feta gets summed" requirement).
   - Menu items with no linked recipe are collected into a separate "Unmapped items" warning list, shown above/below the results, so the user knows their totals are incomplete rather than silently wrong.
4. Output: a table of `{ inventory item name, unit, total quantity needed }`, sorted alphabetically or by category.

New aggregation logic lives in a new file, e.g. `lib/ingredient-requirements.ts`, exporting something like:
```ts
computeIngredientRequirements(orders: Order[], menuItemRecipeMap, recipeIngredientsMap): {
  requirements: { inventoryItemId, name, unit, totalQuantity }[];
  unmappedMenuItems: { itemId, name, orderedQty }[];
}
```
Keep this pure/testable — no Supabase calls inside it — so date filtering, data fetching, and aggregation math stay separately testable.

### MVP v1 — Filter by menu item

On the same requirements page, add a filter control (dropdown or tab strip) with:
- **"All"** — the full aggregated view from v0.
- **One entry per menu item present in the selected orders** — selecting one shows only that menu item's recipe ingredients scaled to its ordered quantity (i.e. skip the cross-recipe aggregation step, show just that recipe's scaled ingredient list).

This reuses the same `computeIngredientRequirements` output — "All" is the aggregated `requirements` array; a per-item view is just that one recipe's scaled ingredients before aggregation, so the underlying function should expose both the per-recipe breakdown and the combined total rather than only the final sum.

### Out of scope for Phase 1 (explicitly deferred)

- Any inventory stock cross-referencing or "what do I need to buy" — that's Phase 2 below.
- Unit conversion between recipe units and purchasing units.
- Multiple recipes per menu item.
- Editing orders/recipes from this new view — it's read-only reporting.

## Phase 2 — Post-MVP (detailed spec, NOT built in this pass)

**Trigger for building this**: once the owner's real-world inventory tracking (via `inventory_batches`/`LogPurchaseForm.tsx`/audits) is reliably kept up to date, so the numbers are trustworthy enough to act on.

### Goal
Extend the Phase 1 requirements view so it also shows, per ingredient: current stock on hand, and how much (if any) needs to be purchased to cover the selected orders.

### Data already available for this
- `inventory_stock_status` view (schema.sql:324-345) already computes `current_stock` and a status (in_stock/need_to_buy/out_of_stock) per `inventory_item_id`, aggregated from active `inventory_batches`.
- No new tables should be needed — Phase 2 is primarily a join between the Phase 1 `requirements` output and `inventory_stock_status`.

### Planned behavior
1. For each row in the Phase 1 requirements table, join against `inventory_stock_status` on `inventory_item_id` to pull `current_stock`.
2. Compute `shortfall = max(0, totalQuantityNeeded - current_stock)`.
3. Visually highlight rows where `shortfall > 0` (e.g. a "need to buy" badge, reusing the `Badge` component's variant system already in `components/ui/Badge.tsx`).
4. Show a "shopping list" sub-view: only the ingredients with a shortfall, with the shortfall quantity, so it can be exported (reuse the CSV export pattern from `OrdersTable.tsx:125-158`) or read off directly while shopping.
5. Do **not** auto-deduct inventory just from viewing this page — actual stock deduction should continue to happen only through the existing post-bake audit flow (`post_bake_audit()` / `AuditChecklist.tsx`), to avoid double-counting or deducting stock for orders that haven't actually been baked yet.

### Open questions to revisit before building Phase 2
- Should the shortfall calculation account for batches already reserved/committed to other upcoming pickup dates, or only current raw stock?
- Does "need to buy" need a purchase-suggestion quantity (e.g. round up to typical pack size), or just the raw shortfall number?

## Files to touch (Phase 1)

- `supabase/schema.sql` — add `menu_items.recipe_id` column + FK (append near `menu_items` table def, ~line 4-14).
- `lib/types.ts` — add `recipe_id` to `MenuItem` type.
- `app/admin/(protected)/menu/ItemLibrary.tsx` + `lib/actions/menu.ts` — add recipe-select field and save it.
- `lib/queries.ts` — add `getOrdersByPickupDateRange(start, end)`.
- `lib/ingredient-requirements.ts` — new pure aggregation module.
- `app/admin/(protected)/orders/requirements/page.tsx` — new page (server component, fetch data).
- New client component (e.g. `RequirementsView.tsx`) — date filter, menu-item filter, results table; model the date-range inputs on `OrdersTable.tsx:178-215` and the CSV export on `OrdersTable.tsx:125-158`.
- `app/admin/(protected)/orders/page.tsx` or `layout.tsx` — add navigation entry point to the new requirements view.

## Verification

1. Manually create/verify test data: a recipe with known `base_yield_qty` and a couple of `recipe_ingredients`, a menu item linked to it via `recipe_id`, and 2-3 test orders with different `pickup_date`s and `order_items` quantities for that menu item (plus another menu item sharing an ingredient, to verify cross-recipe summing).
2. Run `npm run dev`, open `/admin/orders/requirements` (or wherever the entry point ends up), select a pickup-date range covering the test orders, tap "Show what's required."
3. Confirm the "All" view shows correctly summed ingredient quantities across both recipes for the shared ingredient.
4. Switch the menu-item filter to a single item and confirm it shows just that recipe's ingredients scaled to the ordered quantity (matches manual math: `base_weight_grams * (total_ordered / base_yield_qty)`).
5. Confirm a menu item with no `recipe_id` shows up in the "unmapped" warning instead of being silently dropped.
6. Confirm date filtering correctly includes/excludes orders at the range boundaries (inclusive on both ends, matching pickup_date, not created_at).
