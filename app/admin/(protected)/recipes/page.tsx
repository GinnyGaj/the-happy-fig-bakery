import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getAllRecipes } from "@/lib/recipe-queries";
import { getInventoryItems } from "@/lib/inventory-queries";
import { RecipeForm } from "./RecipeForm";
import { DeleteRecipeButton } from "./[id]/DeleteRecipeButton";

export default async function RecipesPage() {
  const [recipes, items] = await Promise.all([getAllRecipes(), getInventoryItems()]);

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <div>
        <h1 className="text-3xl">Recipes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store base recipes as ingredient weights and method steps, ready to scale and bake.
        </p>
      </div>

      <RecipeForm items={items} />

      <section>
        <h2 className="text-xl">All recipes</h2>
        <ul className="mt-4 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <Link href={`/admin/recipes/${recipe.id}`} className="font-medium text-primary underline">
                  {recipe.name}
                </Link>
                {recipe.base_yield_qty != null && (
                  <p className="text-sm text-muted-foreground">
                    Yields {recipe.base_yield_qty} {recipe.base_yield_unit}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{recipe.status}</Badge>
                <ButtonLink
                  href={`/admin/recipes/${recipe.id}/edit`}
                  variant="secondary"
                  className="h-9 px-4 text-sm"
                >
                  Edit
                </ButtonLink>
                <DeleteRecipeButton id={recipe.id} name={recipe.name} />
              </div>
            </li>
          ))}
          {recipes.length === 0 && (
            <li className="px-5 py-4 text-sm text-muted-foreground">No recipes yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
