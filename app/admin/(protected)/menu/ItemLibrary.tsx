"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/actions/menu";
import type { DietaryTag, MenuItem } from "@/lib/types";

const TAGS: DietaryTag[] = ["vegetarian", "vegan", "gluten-free", "nut-free"];

export function ItemLibrary({ items }: { items: MenuItem[] }) {
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Item library</h2>
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

      <ul className="mt-6 flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(item);
                  setAdding(false);
                }}
                className="text-sm text-primary underline"
              >
                Edit
              </button>
              <form
                action={async () => {
                  if (confirm(`Delete ${item.name}?`)) await deleteMenuItem(item.id);
                }}
              >
                <button type="submit" className="text-sm text-destructive underline">
                  Delete
                </button>
              </form>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-5 py-4 text-sm text-muted-foreground">No bakes yet.</li>
        )}
      </ul>
    </section>
  );
}

function ItemForm({ item, onDone }: { item: MenuItem | null; onDone: () => void }) {
  async function action(formData: FormData) {
    if (item) await updateMenuItem(item.id, formData);
    else await createMenuItem(formData);
    onDone();
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Item name" htmlFor="name">
          <Input id="name" name="name" defaultValue={item?.name} required />
        </Field>
        <Field label="Price (£)" htmlFor="price">
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={item?.price} required />
        </Field>
      </div>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
      </Field>
      <div>
        <p className="text-sm font-medium">Dietary tags</p>
        <div className="mt-2 flex flex-wrap gap-4">
          {TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="dietary_tags"
                value={tag}
                defaultChecked={item?.dietary_tags.includes(tag)}
                className="h-4 w-4 accent-primary"
              />
              {tag}
            </label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_free_item"
          defaultChecked={item?.is_free_item}
          className="h-4 w-4 accent-primary"
        />
        This is a free / promotional item
      </label>
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
