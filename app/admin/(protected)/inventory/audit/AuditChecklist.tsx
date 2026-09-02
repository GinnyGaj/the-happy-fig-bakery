"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { runPostBakeAudit } from "@/lib/actions/inventory";
import type { InventoryStockStatus } from "@/lib/types";

export function AuditChecklist({ items }: { items: InventoryStockStatus[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleSave(item: InventoryStockStatus) {
    const raw = values[item.inventory_item_id];
    if (raw === undefined || raw === "") return;
    const newTotal = Number(raw);
    if (!Number.isFinite(newTotal) || newTotal < 0) return;

    setSavingId(item.inventory_item_id);
    setSavedId(null);
    const result = await runPostBakeAudit(item.inventory_item_id, newTotal);
    setSavingId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    setSavedId(item.inventory_item_id);
    router.refresh();
  }

  return (
    <ul className="mt-6 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item) => (
        <li
          key={item.inventory_item_id}
          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              Currently tracked: {item.current_stock} {item.unit}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="How much is left now?"
              value={values[item.inventory_item_id] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [item.inventory_item_id]: e.target.value }))
              }
              className="h-10 w-40 text-sm"
            />
            <Button
              type="button"
              onClick={() => handleSave(item)}
              disabled={savingId === item.inventory_item_id}
              className="h-10 px-4 text-sm"
            >
              {savingId === item.inventory_item_id
                ? "Saving…"
                : savedId === item.inventory_item_id
                  ? "Saved ✓"
                  : "Save"}
            </Button>
          </div>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-5 py-4 text-sm text-muted-foreground">No inventory items yet.</li>
      )}
    </ul>
  );
}
