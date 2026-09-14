import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getRecipe, getRecipeIngredients, getRecipeSections, getRecipeSteps } from "@/lib/recipe-queries";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { ScaleRecipe } from "./ScaleRecipe";
import type { RecipeStage } from "@/lib/types";

const STAGE_LABELS: Record<RecipeStage, string> = {
  pre_prep: "Pre-prep",
  prep: "Prep",
  bake: "Bake",
};
const STAGE_ORDER: RecipeStage[] = ["pre_prep", "prep", "bake"];

export default async function RecipeViewPage({ params }: PageProps<"/admin/recipes/[id]">) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const [ingredients, sections, steps] = await Promise.all([
    getRecipeIngredients(id),
    getRecipeSections(id),
    getRecipeSteps(id),
  ]);
  const ungroupedIngredients = ingredients.filter((ingredient) => !ingredient.section_id);
  const ingredientGroups = [
    ...(ungroupedIngredients.length > 0 ? [{ id: null, name: null, ingredients: ungroupedIngredients }] : []),
    ...sections.map((section) => ({
      id: section.id,
      name: section.name,
      ingredients: ingredients.filter((ingredient) => ingredient.section_id === section.id),
    })),
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/admin/recipes" className="text-sm text-primary underline">
          ← All recipes
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">{recipe.name}</h1>
            <Badge variant="outline">{recipe.status}</Badge>
          </div>
          <div className="flex gap-2">
            <a href={`/admin/recipes/${recipe.id}/download`}>
              <Button type="button" variant="secondary" className="h-9 px-4 text-sm">
                Download
              </Button>
            </a>
            <Link href={`/admin/recipes/${recipe.id}/edit`}>
              <Button type="button" variant="secondary" className="h-9 px-4 text-sm">
                Edit
              </Button>
            </Link>
            <DeleteRecipeButton id={recipe.id} name={recipe.name} />
          </div>
        </div>
        {recipe.base_yield_qty != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            Yields {recipe.base_yield_qty} {recipe.base_yield_unit}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-xl">Ingredients</h2>
        <div className="mt-3 flex flex-col gap-4">
          {ingredientGroups.map((group) => (
            <div key={group.id ?? "ungrouped"}>
              {group.name && (
                <h3 className="mb-2 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {group.name}
                </h3>
              )}
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full table-fixed text-sm">
                  <colgroup>
                    <col className="w-1/2" />
                    <col className="w-1/4" />
                    <col className="w-1/4" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Ingredient</th>
                      <th className="px-4 py-3 font-medium">Weight</th>
                      <th className="px-4 py-3 font-medium">Baker&apos;s %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.ingredients.map((ingredient) => (
                      <tr key={ingredient.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          {ingredient.inventory_items.name}
                          {ingredient.is_percent_base && (
                            <Badge variant="outline" className="ml-2">
                              100% base
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">{ingredient.base_weight_grams}g</td>
                        <td className="px-4 py-3">{ingredient.bakers_percent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {ingredients.length === 0 && (
            <p className="text-sm text-muted-foreground">No ingredients added.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl">Scale recipe</h2>
        <div className="mt-3">
          <ScaleRecipe
            ingredients={ingredients.map((ingredient) => ({
              id: ingredient.id,
              name: ingredient.inventory_items.name,
              base_weight_grams: ingredient.base_weight_grams,
              bakers_percent: ingredient.bakers_percent,
              is_percent_base: ingredient.is_percent_base,
              section_name: sections.find((section) => section.id === ingredient.section_id)?.name ?? null,
            }))}
            baseYieldQty={recipe.base_yield_qty}
            baseYieldUnit={recipe.base_yield_unit}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl">Method</h2>
        <div className="mt-3 flex flex-col gap-5">
          {STAGE_ORDER.map((stage) => {
            const stageSteps = steps.filter((step) => step.stage === stage);
            if (stageSteps.length === 0) return null;
            return (
              <div key={stage}>
                <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {STAGE_LABELS[stage]}
                </h3>
                <ol className="mt-2 flex flex-col gap-1.5 pl-5 text-sm">
                  {stageSteps.map((step) => (
                    <li key={step.id} className="list-decimal">
                      {step.instruction}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
          {steps.length === 0 && <p className="text-sm text-muted-foreground">No steps added.</p>}
        </div>
      </section>

      {recipe.tips_notes && (
        <section>
          <h2 className="text-xl">Tips / notes</h2>
          <p className="mt-2 text-sm text-muted-foreground">{recipe.tips_notes}</p>
        </section>
      )}
    </div>
  );
}
