"use client";

import { SubmitButton } from "@/components/ui/Button";
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
      <SubmitButton variant="destructive" className="h-9 px-4 text-sm">
        Delete
      </SubmitButton>
    </form>
  );
}
