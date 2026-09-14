"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Input";

type ScaleIngredient = {
  id: string;
  name: string;
  base_weight_grams: number;
  bakers_percent: number;
  is_percent_base: boolean;
  section_name: string | null;
};

export function ScaleRecipe({
  ingredients,
  baseYieldQty,
  baseYieldUnit,
}: {
  ingredients: ScaleIngredient[];
  baseYieldQty: number | null;
  baseYieldUnit: string | null;
}) {
  const [targetYield, setTargetYield] = useState<string>("");

  if (baseYieldQty == null || baseYieldQty <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a base yield to this recipe to enable scaling.
      </p>
    );
  }

  const parsedTarget = Number(targetYield);
  const hasValidTarget = targetYield.trim() !== "" && !Number.isNaN(parsedTarget) && parsedTarget > 0;
  const factor = hasValidTarget ? parsedTarget / baseYieldQty : null;

  const groups = new Map<string | null, ScaleIngredient[]>();
  for (const ingredient of ingredients) {
    const key = ingredient.section_name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ingredient);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <Field label="Target yield" htmlFor="scale-target-yield">
          <Input
            id="scale-target-yield"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder={`${baseYieldQty}`}
            value={targetYield}
            onChange={(event) => setTargetYield(event.target.value)}
            className="w-40"
          />
        </Field>
        <span className="pb-3 text-sm text-muted-foreground">
          {baseYieldUnit ?? "units"} (base recipe yields {baseYieldQty} {baseYieldUnit})
        </span>
      </div>

      {factor != null && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Scale factor: <Badge variant="outline">{factor.toFixed(3)}×</Badge>
          </p>
          {[...groups.entries()].map(([sectionName, groupIngredients]) => (
            <div key={sectionName ?? "ungrouped"}>
              {sectionName && (
                <h3 className="mb-2 text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {sectionName}
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
                      <th className="px-4 py-3 font-medium">Scaled weight</th>
                      <th className="px-4 py-3 font-medium">Baker&apos;s %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupIngredients.map((ingredient) => (
                      <tr key={ingredient.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          {ingredient.name}
                          {ingredient.is_percent_base && (
                            <Badge variant="outline" className="ml-2">
                              100% base
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(ingredient.base_weight_grams * factor).toFixed(1)}g
                        </td>
                        <td className="px-4 py-3">{ingredient.bakers_percent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
