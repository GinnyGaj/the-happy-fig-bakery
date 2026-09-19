"use client";

import { SubmitButton } from "@/components/ui/Button";
import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      className="flex-1 sm:flex-none"
      action={async () => {
        if (confirm(`Delete "${name}"? This removes its ingredients and steps too.`)) {
          await deleteRecipe(id);
        }
      }}
    >
      <SubmitButton variant="destructive" className="h-9 w-full px-4 text-sm">
        Delete
      </SubmitButton>
    </form>
  );
}
