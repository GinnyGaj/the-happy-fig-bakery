"use client";

import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={async () => {
        if (confirm(`Delete "${name}"? This removes its ingredients and steps too.`)) {
          await deleteRecipe(id);
        }
      }}
    >
      <button
        type="submit"
        className="flex h-9 items-center rounded-lg border border-destructive px-4 text-sm text-destructive"
      >
        Delete
      </button>
    </form>
  );
}
