# Recipe Management System (Admin Portal)

## Context
The Happy Fig's admin currently manages menu, orders, and inventory (`app/admin/(protected)/{menu,orders,inventory}`), but has no way to store baking recipes, scale them up/down, or track multi-day bake progress. The owner wants a recipe module that captures a base recipe + baker's-percentage breakdown, lets them scale to any target yield, export to a spreadsheet, and step through "making" a recipe (persisted across days). Modules, in build order: (1) Add/View, (2) Edit/Delete, (3) Download, (4) Scale, (5) Make this recipe, (6) Recipe/Idea bank.

## Clarified decisions (from user Q&A)
- **Ingredients**: link directly to the existing `inventory_items` table (no separate ingredients master) — sets up future recipe-costing/inventory-usage integration for free.
- **Scaling math**: admin enters a base recipe as ingredient weights (flour = 100% baker's basis, others as % of flour) plus a yield count (e.g. 200g flour+100g butter+100g sugar+100g milk = 500g → 10 cookies, i.e. 50g/unit). Scaling to a target yield N computes `factor = N / base_yield` and multiplies every ingredient's base weight by `factor`; baker's % values are stored/display-only (recomputed from weights, unchanged by scaling since all weights scale uniformly).
- **Method of prep**: pre-prep/prep/bake step lists are static text, never altered by scaling.
- **Idea bank**: same `recipes` table as full recipes, distinguished by a `status` field (`idea` / `draft` / `complete`), so an idea can be filled in incrementally and "become" a recipe with no data migration.
- **Make this recipe**: multiple recipes can be in progress concurrently (independent sessions per attempt), and progress must persist across days.
- **Export**: XLSX via `exceljs` (new dependency — nothing installed today handles spreadsheets; existing CSV pattern in `OrdersTable.tsx` doesn't support the two-section ingredients+method layout wanted).

## Data model (new tables in `supabase/schema.sql`, following its existing append-only `create table if not exists` + RLS-per-table convention)

- **`recipes`**
  `id, name, status (idea/draft/complete), base_yield_qty numeric, base_yield_unit text (e.g. "cookies"), tips_notes text, created_at, updated_at`.
- **`recipe_ingredients`**
  `id, recipe_id fk→recipes(cascade), inventory_item_id fk→inventory_items, base_weight_grams numeric, bakers_percent numeric, sort_order int`.
  Baker's % is derived (`base_weight_grams / flour_total * 100`) but stored redundantly for fast display/export, recalculated on save.
- **`recipe_steps`**
  `id, recipe_id fk→recipes(cascade), stage text check in (pre_prep, prep, bake), step_number int, instruction text`.
- **`recipe_sessions`** (Make-this-recipe)
  `id, recipe_id fk→recipes, target_yield_qty numeric, status (in_progress/done/quit), started_at, completed_at`.
- **`recipe_session_step_progress`**
  `id, session_id fk→recipe_sessions(cascade), recipe_step_id fk→recipe_steps, is_done boolean, done_at`.
  One row per step per session; querying "steps left" is a simple join. Supports many concurrent sessions cleanly (mirrors `inventory_batches`/`expense_items` parent-child pattern already in the schema).

RLS: same `auth.role() = 'authenticated'` policy as every other admin table (`inventory_items`, `orders`, etc. — see lines ~430-436 of `supabase/schema.sql`).

## Module plan

**1. Add/View** — `app/admin/(protected)/recipes/` list page + `recipes/new` form page. Form: recipe name, ingredient rows (searchable select bound to `inventory_items`, weight input, auto-computed baker's %), base yield qty+unit, pre-prep/prep/bake step lists (add/remove rows), tips/notes textarea. Server actions in new `lib/actions/recipes.ts`, following the existing pattern in `lib/actions/menu.ts` / `lib/actions/inventory.ts` (`"use server"`, then `revalidatePath`). View mode = same layout, read-only, reached via `recipes/[id]`.

**2. Edit/Delete** — `recipes/[id]/edit` reuses the Add form pre-filled. Delete needs a **confirmation step before destructive action** — since no modal/dialog library exists in the project yet, add a small reusable `components/ui/ConfirmDialog.tsx` (native `<dialog>` element or simple overlay component) rather than pulling in a new UI kit; first real use of a confirm-before-delete pattern in this codebase.

**3. Download** — "Download" button on `recipes/[id]` calls a server action that builds a workbook with `exceljs` (new dependency to add to `package.json`): sheet with ingredient name / weight / baker's % columns, followed by a method-of-prep section (stage headers + numbered steps), returns a buffer streamed as an XLSX download.

**4. Scale** — On `recipes/[id]`, a "Scale" control prompts for target yield, computes `factor = target / base_yield_qty`, and renders (client-side, no DB write needed) the scaled ingredient list + unchanged method text. Optionally reuse the same computation for a "download scaled version" export later, but base plan keeps this an on-screen scaled view only.

**5. Make this recipe** — `recipes/[id]/make` starts (or resumes, if an `in_progress` session exists) a `recipe_sessions` row, shows a checklist per stage sourced from `recipe_steps` joined to `recipe_session_step_progress`, checkboxes persist immediately via server action (so progress survives across days/reloads). "Quit" sets session status `quit`; "Mark done" sets `done` + `completed_at`. An admin-portal "Active bakes" list shows all `in_progress` sessions (supports the confirmed multi-concurrent-session requirement).

**6. Recipe/Idea bank** — the `recipes` list page itself, filterable by `status`. Creating a recipe with just a name/notes and `status = idea` is the "add an idea" flow; editing it further to add ingredients/steps and flipping `status` to `draft`/`complete` is the "build it out" flow — no separate screens needed given the shared-table decision.

## Navigation
Add "Recipes" to the sidebar in `app/admin/(protected)/layout.tsx`, next to Menu/Orders/Inventory.

## Verification
- `supabase db reset` (or apply the new `create table` statements) locally, confirm RLS policies match existing table conventions.
- Manual walkthrough per module: add a recipe with 3+ ingredients referencing real `inventory_items`, verify baker's % auto-calculates; edit and delete (confirm dialog blocks accidental delete); download and open the XLSX to check ingredient table + method sections render correctly; scale to a few different target yields and hand-check the math against the 200/100/100/100→10 cookies example; start two concurrent "make this recipe" sessions, close the browser, reopen, confirm progress persisted; add an idea-only recipe and confirm it appears in the bank distinct from complete ones.
