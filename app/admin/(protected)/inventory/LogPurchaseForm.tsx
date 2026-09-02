"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { logPurchase } from "@/lib/actions/inventory";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "@/lib/types";

interface Row {
  key: string;
  itemId: string;
  quantity: string;
  cost: string;
  expiryDate: string;
}

function emptyRow(): Row {
  return { key: crypto.randomUUID(), itemId: "", quantity: "", cost: "", expiryDate: "" };
}

export function LogPurchaseForm({ items }: { items: InventoryItem[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [receiptPath, setReceiptPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!open) {
    return (
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Log purchase / expense</h2>
          <Button type="button" onClick={() => setOpen(true)} className="h-10 px-5 text-sm">
            Log Purchase
          </Button>
        </div>
      </section>
    );
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      setReceiptPath(path);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function action(formData: FormData) {
    formData.set("receipt_photo_path", receiptPath);
    await logPurchase(formData);
    setOpen(false);
    setRows([emptyRow()]);
    setReceiptPath("");
  }

  return (
    <section>
      <h2 className="text-xl">Log purchase / expense</h2>
      <form
        action={action}
        className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="expense_date">
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </Field>
          <Field label="Vendor" htmlFor="vendor">
            <Input id="vendor" name="vendor" placeholder="e.g. Costco" />
          </Field>
          <div>
            <p className="text-sm font-medium">Receipt photo</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptChange}
              disabled={uploading}
              className="mt-2 text-sm"
            />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            {receiptPath && !uploading && (
              <p className="text-xs text-secondary-foreground">Receipt attached ✓</p>
            )}
          </div>
        </div>

        <Field label="Notes (optional)" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Items on this receipt</p>
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 sm:grid-cols-5 sm:items-end"
            >
              <div className="col-span-2 sm:col-span-2">
                <label className="text-xs text-muted-foreground">Item</label>
                <Select
                  name="item_id"
                  value={row.itemId}
                  onChange={(e) => updateRow(row.key, { itemId: e.target.value })}
                  required
                  className="mt-1"
                >
                  <option value="" disabled>
                    Select item
                  </option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.unit})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Quantity</label>
                <Input
                  name="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cost (£)</label>
                <Input
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.cost}
                  onChange={(e) => updateRow(row.key, { cost: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Expiry (optional)</label>
                  <Input
                    name="expiry_date"
                    type="date"
                    value={row.expiryDate}
                    onChange={(e) => updateRow(row.key, { expiryDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    className="h-10 text-xs text-destructive underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
            className="h-9 w-fit px-4 text-xs"
          >
            Add another item
          </Button>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={uploading} className="h-10 px-5 text-sm">
            Save Purchase
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            className="h-10 px-5 text-sm"
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
