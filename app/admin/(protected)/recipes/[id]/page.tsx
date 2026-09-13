import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { getRecipe, getRecipeIngredients, getRecipeSteps } from "@/lib/recipe-queries";
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

  const [ingredients, steps] = await Promise.all([getRecipeIngredients(id), getRecipeSteps(id)]);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/admin/recipes" className="text-sm text-primary underline">
          ← All recipes
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-3xl">{recipe.name}</h1>
          <Badge variant="outline">{recipe.status}</Badge>
        </div>
        {recipe.base_yield_qty != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            Yields {recipe.base_yield_qty} {recipe.base_yield_unit}
          </p>
        )}
      </div>

      <section>
        <h2 className="text-xl">Ingredients</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Ingredient</th>
                <th className="px-4 py-3 font-medium">Weight</th>
                <th className="px-4 py-3 font-medium">Baker&apos;s %</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{ingredient.inventory_items.name}</td>
                  <td className="px-4 py-3">{ingredient.base_weight_grams}g</td>
                  <td className="px-4 py-3">{ingredient.bakers_percent.toFixed(1)}%</td>
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                    No ingredients added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
