"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DeleteRecipeButton } from "./[id]/DeleteRecipeButton";
import type { Recipe, RecipeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { label: string; value: RecipeStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Idea", value: "idea" },
  { label: "Draft", value: "draft" },
  { label: "Complete", value: "complete" },
];

export function RecipeList({ recipes }: { recipes: Recipe[] }) {
  const [statusFilter, setStatusFilter] = useState<RecipeStatus | "all">("all");

  const filteredRecipes = recipes.filter(
    (recipe) => statusFilter === "all" || recipe.status === statusFilter
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl">All recipes</h2>
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs uppercase tracking-[0.1em]",
                statusFilter === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {filteredRecipes.map((recipe) => (
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
        {filteredRecipes.length === 0 && (
          <li className="px-5 py-4 text-sm text-muted-foreground">No recipes found.</li>
        )}
      </ul>
    </section>
  );
}
