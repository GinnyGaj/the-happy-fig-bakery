"use client";

import { Fragment, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "@/lib/actions/inventory";
import type {
  InventoryBatch,
  InventoryCategory,
  InventoryItem,
  InventoryStockStatus,
  InventoryUnit,
} from "@/lib/types";

export const CATEGORIES: InventoryCategory[] = [
  "Dairy & Fresh",
  "Dry Goods & Bulk",
  "Spices & Flavors",
  "Packaging & Paper",
  "Consumables",
];

export const UNITS: InventoryUnit[] = [
  "g",
  "kg",
  "ml",
  "l",
  "count",
  "tsp",
  "tbsp",
  "pack",
  "roll",
  "box",
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "need_to_buy", label: "Need to Buy / Low Stock" },
  { value: "expiring_soon", label: "Expiring Soon" },
] as const;

const STATUS_LABEL: Record<InventoryStockStatus["status"], string> = {
  in_stock: "In Stock",
  need_to_buy: "Need to Buy",
  out_of_stock: "Out of Stock",
};

function statusBadgeProps(status: InventoryStockStatus["status"]) {
  if (status === "in_stock") return { variant: "sage" as const, className: undefined };
  if (status === "need_to_buy")
    return { variant: "outline" as const, className: "border-amber-600 text-amber-700" };
  return { variant: "outline" as const, className: "border-destructive text-destructive" };
}

function daysUntil(dateStr: string) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function earliestExpiry(batches: InventoryBatch[]) {
  const dates = batches
    .filter((b) => b.is_active && b.expiry_date)
    .map((b) => b.expiry_date as string)
    .sort();
  return dates[0] ?? null;
}

export function InventoryTable({
  stock,
  batches,
  items,
}: {
  stock: InventoryStockStatus[];
  batches: InventoryBatch[];
  items: InventoryItem[];
}) {
  const [category, setCategory] = useState<"all" | InventoryCategory>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>(
    "all"
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const batchesByItem = useMemo(() => {
    const map = new Map<string, InventoryBatch[]>();
    for (const batch of batches) {
      const list = map.get(batch.inventory_item_id) ?? [];
      list.push(batch);
      map.set(batch.inventory_item_id, list);
    }
    return map;
  }, [batches]);

  const filtered = useMemo(() => {
    return stock.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (statusFilter === "need_to_buy" && item.status === "in_stock") return false;
      if (statusFilter === "expiring_soon") {
        const expiry = earliestExpiry(batchesByItem.get(item.inventory_item_id) ?? []);
        if (!expiry || daysUntil(expiry) > 5) return false;
      }
      return true;
    });
  }, [stock, category, statusFilter, batchesByItem]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Master inventory</h2>
        {!adding && !editing && (
          <Button type="button" onClick={() => setAdding(true)} className="h-10 px-5 text-sm">
            Add New Item
          </Button>
        )}
      </div>

      {(adding || editing) && (
        <ItemForm
          item={editing}
          onDone={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterPill active={category === "all"} onClick={() => setCategory("all")}>
            All
          </FilterPill>
          {CATEGORIES.map((c) => (
            <FilterPill key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </FilterPill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <FilterPill
              key={s.value}
              active={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Earliest Expiry</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const itemBatches = batchesByItem.get(item.inventory_item_id) ?? [];
              const expiry = earliestExpiry(itemBatches);
              const isExpanded = expanded === item.inventory_item_id;
              return (
                <Fragment key={item.inventory_item_id}>
                  <tr
                    onClick={() =>
                      setExpanded(isExpanded ? null : item.inventory_item_id)
                    }
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">
                      {item.current_stock} {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      <Badge {...statusBadgeProps(item.status)}>
                        {STATUS_LABEL[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{expiry ?? "—"}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-nowrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const fullItem = itemsById.get(item.inventory_item_id);
                            if (fullItem) setEditing(fullItem);
                            setAdding(false);
                          }}
                          className="text-sm text-primary underline"
                        >
                          Edit
                        </button>
                        <form
                          action={async () => {
                            if (confirm(`Delete ${item.name}? This also removes its batches.`)) {
                              await deleteInventoryItem(item.inventory_item_id);
                            }
                          }}
                        >
                          <button type="submit" className="text-sm text-destructive underline">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-border bg-muted/30">
                      <td colSpan={6} className="px-4 py-3">
                        {itemBatches.length === 0 ? (
                          <p className="text-muted-foreground">No batches purchased yet.</p>
                        ) : (
                          <table className="w-full text-left text-xs">
                            <thead className="text-muted-foreground">
                              <tr>
                                <th className="py-1 pr-4">Purchased</th>
                                <th className="py-1 pr-4">Expiry</th>
                                <th className="py-1 pr-4">Remaining</th>
                                <th className="py-1 pr-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itemBatches.map((b) => (
                                <tr key={b.id}>
                                  <td className="py-1 pr-4">{b.purchase_date}</td>
                                  <td className="py-1 pr-4">{b.expiry_date ?? "—"}</td>
                                  <td className="py-1 pr-4">
                                    {b.quantity_remaining} / {b.quantity_purchased} {item.unit}
                                  </td>
                                  <td className="py-1 pr-4">
                                    {b.is_active ? "Active" : "Consumed"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No inventory items match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function ItemForm({
  item,
  onDone,
}: {
  item: InventoryItem | null;
  onDone: () => void;
}) {
  async function action(formData: FormData) {
    if (item) await updateInventoryItem(item.id, formData);
    else await createInventoryItem(formData);
    onDone();
  }

  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Item name" htmlFor="name">
          <Input id="name" name="name" defaultValue={item?.name} required />
        </Field>
        <Field label="Low stock threshold" htmlFor="low_stock_threshold">
          <Input
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item?.low_stock_threshold ?? 0}
            required
          />
        </Field>
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue={item?.category} required>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unit" htmlFor="unit">
          <Select id="unit" name="unit" defaultValue={item?.unit} required>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes (optional)" htmlFor="notes">
        <Input id="notes" name="notes" defaultValue={item?.notes ?? ""} />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" className="h-10 px-5 text-sm">
          {item ? "Save changes" : "Add item"}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone} className="h-10 px-5 text-sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}
