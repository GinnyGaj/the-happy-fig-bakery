"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

interface ScaleIngredientGroup {
  id: string | null;
  name: string | null;
  ingredients: {
    id: string;
    name: string;
    baseWeightGrams: number;
    bakersPercent: number;
    isPercentBase: boolean;
  }[];
}

export function ScaleRecipeButton({
  recipeId,
  baseYieldQty,
  baseYieldUnit,
  ingredientGroups,
}: {
  recipeId: string;
  baseYieldQty: number | null;
  baseYieldUnit: string | null;
  ingredientGroups: ScaleIngredientGroup[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pendingInput, setPendingInput] = useState("");
  const [scaleFactor, setScaleFactor] = useState<number | null>(null);
  const [targetYield, setTargetYield] = useState<number | null>(null);

  const hasBaseYield = baseYieldQty != null && baseYieldQty > 0;

  const openDialog = () => {
    setPendingInput("");
    setScaleFactor(null);
    setTargetYield(null);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => dialogRef.current?.close();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(pendingInput);
    if (pendingInput.trim() === "" || Number.isNaN(parsed) || parsed <= 0 || !hasBaseYield) return;
    setTargetYield(parsed);
    setScaleFactor(parsed / (baseYieldQty as number));
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-9 flex-1 px-4 text-sm sm:flex-none"
        onClick={openDialog}
        disabled={!hasBaseYield}
        title={hasBaseYield ? undefined : "Add a base yield to this recipe to enable scaling"}
      >
        Scale
      </Button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-4 text-foreground backdrop:bg-black/40 sm:p-6"
      >
        {scaleFactor == null ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">Scale recipe</h2>
            <Field label={`How many ${baseYieldUnit ?? "units"} do you want to make?`} htmlFor="scale-target-yield">
              <Input
                id="scale-target-yield"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                autoFocus
                placeholder={hasBaseYield ? `${baseYieldQty}` : undefined}
                value={pendingInput}
                onChange={(event) => setPendingInput(event.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="h-9 px-4 text-sm" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-4 text-sm">
                Scale
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-medium">
                Scaled ingredients — {targetYield} {baseYieldUnit}
              </h2>
              <Badge variant="outline">{scaleFactor.toFixed(3)}×</Badge>
            </div>
            <div className="flex flex-col gap-4">
              {ingredientGroups.map((group) => (
                <div key={group.id ?? "ungrouped"}>
                  {group.name && (
                    <h3 className="mb-2 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {group.name}
                    </h3>
                  )}
                  <div className="overflow-x-auto rounded-2xl border border-border bg-background">
                    <table className="w-full table-fixed text-sm">
                      <colgroup>
                        <col className="w-1/2" />
                        <col className="w-1/4" />
                        <col className="w-1/4" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="px-2 py-2.5 font-medium sm:px-4 sm:py-3">Ingredient</th>
                          <th className="px-2 py-2.5 font-medium sm:px-4 sm:py-3">Scaled weight</th>
                          <th className="px-2 py-2.5 font-medium sm:px-4 sm:py-3">Baker&apos;s %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.ingredients.map((ingredient) => (
                          <tr key={ingredient.id} className="border-b border-border last:border-0">
                            <td className="px-2 py-2.5 sm:px-4 sm:py-3">
                              {ingredient.name}
                              {ingredient.isPercentBase && (
                                <Badge variant="outline" className="ml-2">
                                  100% base
                                </Badge>
                              )}
                            </td>
                            <td className="px-2 py-2.5 sm:px-4 sm:py-3">
                              {(ingredient.baseWeightGrams * scaleFactor).toFixed(1)}g
                            </td>
                            <td className="px-2 py-2.5 sm:px-4 sm:py-3">{ingredient.bakersPercent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="h-9 px-4 text-sm" onClick={() => setScaleFactor(null)}>
                Back
              </Button>
              <a href={`/admin/recipes/${recipeId}/download?target=${targetYield}`}>
                <Button type="button" className="h-9 px-4 text-sm">
                  Download
                </Button>
              </a>
              <Button type="button" variant="secondary" className="h-9 px-4 text-sm" onClick={closeDialog}>
                Close
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
