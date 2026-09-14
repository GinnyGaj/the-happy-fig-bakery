import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe, getRecipeIngredients, getRecipeSections, getRecipeSteps } from "@/lib/recipe-queries";
import { getInventoryItems } from "@/lib/inventory-queries";
import { RecipeEditForm } from "../../RecipeForm";

export default async function RecipeEditPage({ params }: PageProps<"/admin/recipes/[id]/edit">) {
  const { id } = await params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const [items, ingredients, sections, steps] = await Promise.all([
    getInventoryItems(),
    getRecipeIngredients(id),
    getRecipeSections(id),
    getRecipeSteps(id),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link href={`/admin/recipes/${id}`} className="text-sm text-primary underline">
          ← Back to recipe
        </Link>
        <h1 className="mt-2 text-3xl">Edit {recipe.name}</h1>
      </div>

      <RecipeEditForm items={items} recipe={recipe} sections={sections} ingredients={ingredients} steps={steps} />
    </div>
  );
}
