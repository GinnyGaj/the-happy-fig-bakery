"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type {
  IngredientRequirement,
  IngredientRequirementsResult,
  UnmappedReason,
} from "@/lib/ingredient-requirements";

const UNMAPPED_REASON_LABELS: Record<UnmappedReason, string> = {
  no_recipe_linked: "No recipe linked — link a recipe on the menu item",
  missing_base_yield: "Recipe linked, but missing a base yield quantity",
  no_recipe_ingredients: "Recipe linked, but has no ingredients added",
};

export function RequirementsView({
  start,
  end,
  result,
  hasSearched,
}: {
  start: string;
  end: string;
  result: IngredientRequirementsResult;
  hasSearched: boolean;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [selectedItemId, setSelectedItemId] = useState("all");

  function handleShowRequired() {
    if (!startDate || !endDate) return;
    router.push(`/admin/orders/requirements?start=${startDate}&end=${endDate}`);
  }

  const selectedBreakdown = useMemo(
    () => result.byMenuItem.find((b) => b.itemId === selectedItemId),
    [result.byMenuItem, selectedItemId]
  );

  const rows: IngredientRequirement[] =
    selectedItemId === "all" ? result.requirements : selectedBreakdown?.ingredients ?? [];

  const unmappedByReason = useMemo(() => {
    const groups = new Map<UnmappedReason, typeof result.unmappedMenuItems>();
    for (const u of result.unmappedMenuItems) {
      const group = groups.get(u.reason);
      if (group) group.push(u);
      else groups.set(u.reason, [u]);
    }
    return groups;
  }, [result.unmappedMenuItems]);

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
          From
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 w-full text-sm sm:w-auto"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
          To
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 w-full text-sm sm:w-auto"
          />
        </label>
        <Button
          type="button"
          onClick={handleShowRequired}
          disabled={!startDate || !endDate}
          className="h-10 w-full px-5 text-sm sm:w-auto"
        >
          Show what&apos;s required
        </Button>
      </div>

      {hasSearched && (
        <>
          {result.byMenuItem.length > 0 && (
            <div className="mt-6">
              <label className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
                Show
                <Select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full sm:w-64"
                >
                  <option value="all">All items (combined)</option>
                  {result.byMenuItem.map((b) => (
                    <option key={b.itemId} value={b.itemId}>
                      {b.itemName} (×{b.orderedQty})
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          )}

          {result.unmappedMenuItems.length > 0 && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                Some items are excluded from totals below
              </p>
              <div className="mt-2 flex flex-col gap-3">
                {Array.from(unmappedByReason.entries()).map(([reason, items]) => (
                  <div key={reason}>
                    <p className="text-sm font-medium text-muted-foreground">
                      {UNMAPPED_REASON_LABELS[reason]}
                    </p>
                    <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                      {items.map((u) => (
                        <li key={u.itemId}>
                          {u.name} (×{u.orderedQty})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Total needed</th>
                  <th className="px-4 py-3">In stock</th>
                  <th className="px-4 py-3">Surplus / deficit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.inventoryItemId}
                    className={`border-b border-border last:border-0 ${
                      r.isLowStock ? "bg-destructive/5 font-medium text-destructive" : ""
                    }`}
                  >
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.unit}</td>
                    <td className="px-4 py-3">{r.totalQuantity.toFixed(1)}</td>
                    <td className="px-4 py-3">{r.onHand.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      {r.surplusOrDeficit > 0 ? "+" : ""}
                      {r.surplusOrDeficit.toFixed(1)}
                      {r.isLowStock ? " — need to buy" : ""}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No ingredient requirements for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
