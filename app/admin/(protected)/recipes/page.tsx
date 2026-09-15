import { getAllRecipes } from "@/lib/recipe-queries";
import { getInventoryItems } from "@/lib/inventory-queries";
import { RecipeForm } from "./RecipeForm";
import { RecipeList } from "./RecipeList";

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

      <RecipeList recipes={recipes} />
    </div>
  );
}
