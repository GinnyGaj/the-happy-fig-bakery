"use client";

import { useState } from "react";
import Image from "next/image";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/actions/menu";
import { createClient } from "@/lib/supabase/client";
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
              <p className="text-sm text-muted-foreground">
                {formatPrice(item.price)}
                {item.max_limit != null && ` · Max ${item.max_limit} per week`}
              </p>
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
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function action(formData: FormData) {
    formData.set("image_url", imageUrl);
    if (item) await updateMenuItem(item.id, formData);
    else await createMenuItem(formData);
    onDone();
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
      <Field label="Max orders per week (optional)" htmlFor="max_limit">
        <Input
          id="max_limit"
          name="max_limit"
          type="number"
          step="1"
          min="0"
          placeholder="Unlimited"
          defaultValue={item?.max_limit ?? ""}
        />
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={item?.description ?? ""} />
      </Field>
      <div>
        <p className="text-sm font-medium">Photo</p>
        <div className="mt-2 flex items-center gap-4">
          {imageUrl ? (
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted">
              <Image src={imageUrl} alt="" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              No photo
            </div>
          )}
          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              className="text-sm"
            />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            {imageUrl && !uploading && (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="w-fit text-xs text-destructive underline"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>
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
