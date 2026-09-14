"use client";

import { useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createRecipe } from "@/lib/actions/recipes";
import type { InventoryItem, RecipeStage } from "@/lib/types";

const STAGES: { value: RecipeStage; label: string }[] = [
  { value: "pre_prep", label: "Pre-prep" },
  { value: "prep", label: "Prep" },
  { value: "bake", label: "Bake" },
];

interface IngredientRow {
  key: number;
  inventory_item_id: string;
  base_weight_grams: string;
}

const BASE_INPUT_NAME = "ingredient_is_base";

interface SectionRow {
  key: number;
  name: string;
  ingredients: IngredientRow[];
}

interface StepRow {
  key: number;
  stage: RecipeStage;
  instruction: string;
}

export function RecipeForm({ items }: { items: InventoryItem[] }) {
  const [adding, setAdding] = useState(false);

  if (!adding) {
    return (
      <Button type="button" onClick={() => setAdding(true)} className="h-10 w-fit px-5 text-sm">
        Add New Recipe
      </Button>
    );
  }

  return <RecipeFormFields items={items} onDone={() => setAdding(false)} />;
}

let nextKey = 1;

function RecipeFormFields({ items, onDone }: { items: InventoryItem[]; onDone: () => void }) {
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { key: nextKey++, inventory_item_id: "", base_weight_grams: "" },
  ]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [steps, setSteps] = useState<StepRow[]>([
    { key: nextKey++, stage: "pre_prep", instruction: "" },
  ]);
  const [baseKey, setBaseKey] = useState<number | null>(null);

  // Baker's % is a single formula-wide total across ungrouped ingredients
  // and every section, calculated against the single ingredient the admin
  // chose as the 100% base.
  const allIngredientRows = [...ingredients, ...sections.flatMap((section) => section.ingredients)];
  const baseRow = allIngredientRows.find((row) => row.key === baseKey);
  const baseTotal = Number(baseRow?.base_weight_grams) || 0;

  function bakersPercent(row: IngredientRow) {
    const weight = Number(row.base_weight_grams) || 0;
    if (baseTotal <= 0) return 0;
    return (weight / baseTotal) * 100;
  }

  return (
    <form action={createRecipe} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Recipe name" htmlFor="name">
          <Input id="name" name="name" required />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue="draft">
            <option value="idea">Idea</option>
            <option value="draft">Draft</option>
            <option value="complete">Complete</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Base yield quantity" htmlFor="base_yield_qty">
          <Input id="base_yield_qty" name="base_yield_qty" type="number" step="0.01" min="0" />
        </Field>
        <Field label="Base yield unit" htmlFor="base_yield_unit">
          <Input id="base_yield_unit" name="base_yield_unit" placeholder="e.g. cookies" />
        </Field>
      </div>

      <div>
        <p className="text-sm font-medium">Ingredients</p>
        <p className="text-xs text-muted-foreground">
          Choose one ingredient below as the 100% base — every baker&apos;s % is calculated against its weight. Use
          sections below to group ingredients (e.g. dough, frosting) — anything added here stays ungrouped.
        </p>
        <IngredientRowsEditor
          items={items}
          rows={ingredients}
          setRows={setIngredients}
          sectionIndex={-1}
          bakersPercent={bakersPercent}
          baseKey={baseKey}
          setBaseKey={setBaseKey}
        />
        <button
          type="button"
          onClick={() =>
            setIngredients((prev) => [...prev, { key: nextKey++, inventory_item_id: "", base_weight_grams: "" }])
          }
          className="mt-3 text-sm text-primary underline"
        >
          Add ingredient
        </button>
      </div>

      <div>
        <p className="text-sm font-medium">Sections</p>
        <p className="text-xs text-muted-foreground">
          Group ingredients under a named section, e.g. &quot;Dough&quot;, &quot;Frosting&quot;, &quot;Cinnamon
          sugar&quot;.
        </p>
        <div className="mt-3 flex flex-col gap-4">
          {sections.map((section, sectionIndex) => (
            <div key={section.key} className="rounded-xl border border-border p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Field label="Section name" htmlFor={`section-${section.key}`}>
                    <Input
                      id={`section-${section.key}`}
                      name="section_name"
                      placeholder="e.g. Dough"
                      value={section.name}
                      onChange={(e) =>
                        setSections((prev) =>
                          prev.map((s, i) => (i === sectionIndex ? { ...s, name: e.target.value } : s))
                        )
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  onClick={() => setSections((prev) => prev.filter((_, i) => i !== sectionIndex))}
                  className="text-sm text-destructive underline"
                >
                  Remove section
                </button>
              </div>
              <IngredientRowsEditor
                items={items}
                rows={section.ingredients}
                setRows={(update) =>
                  setSections((prev) =>
                    prev.map((s, i) =>
                      i === sectionIndex
                        ? { ...s, ingredients: typeof update === "function" ? update(s.ingredients) : update }
                        : s
                    )
                  )
                }
                sectionIndex={sectionIndex}
                bakersPercent={bakersPercent}
                baseKey={baseKey}
                setBaseKey={setBaseKey}
              />
              <button
                type="button"
                onClick={() =>
                  setSections((prev) =>
                    prev.map((s, i) =>
                      i === sectionIndex
                        ? {
                            ...s,
                            ingredients: [
                              ...s.ingredients,
                              { key: nextKey++, inventory_item_id: "", base_weight_grams: "" },
                            ],
                          }
                        : s
                    )
                  )
                }
                className="mt-3 text-sm text-primary underline"
              >
                Add ingredient
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setSections((prev) => [...prev, { key: nextKey++, name: "", ingredients: [] }])
          }
          className="mt-3 text-sm text-primary underline"
        >
          Add section
        </button>
      </div>

      <div>
        <p className="text-sm font-medium">Method of prep</p>
        <div className="mt-3 flex flex-col gap-3">
          {steps.map((row, index) => (
            <div key={row.key} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[140px_1fr_auto]">
              <Field label="Stage" htmlFor={`stage-${row.key}`}>
                <Select
                  id={`stage-${row.key}`}
                  name="step_stage"
                  value={row.stage}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((r, i) => (i === index ? { ...r, stage: e.target.value as RecipeStage } : r))
                    )
                  }
                >
                  {STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Instruction" htmlFor={`instruction-${row.key}`}>
                <Input
                  id={`instruction-${row.key}`}
                  name="step_instruction"
                  value={row.instruction}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((r, i) => (i === index ? { ...r, instruction: e.target.value } : r))
                    )
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
                className="text-sm text-destructive underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, { key: nextKey++, stage: "pre_prep", instruction: "" }])}
          className="mt-3 text-sm text-primary underline"
        >
          Add step
        </button>
      </div>

      <Field label="Tips / notes" htmlFor="tips_notes">
        <Textarea id="tips_notes" name="tips_notes" />
      </Field>

      <div className="flex gap-3">
        <Button type="submit" className="h-10 px-5 text-sm">
          Add recipe
        </Button>
        <Button type="button" variant="secondary" onClick={onDone} className="h-10 px-5 text-sm">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function IngredientRowsEditor({
  items,
  rows,
  setRows,
  sectionIndex,
  bakersPercent,
  baseKey,
  setBaseKey,
}: {
  items: InventoryItem[];
  rows: IngredientRow[];
  setRows: (update: IngredientRow[] | ((prev: IngredientRow[]) => IngredientRow[])) => void;
  sectionIndex: number;
  bakersPercent: (row: IngredientRow) => number;
  baseKey: number | null;
  setBaseKey: (key: number) => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={row.key} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[auto_1fr_140px_90px_auto]">
          <input type="hidden" name="ingredient_section_index" value={sectionIndex} />
          <input type="hidden" name="ingredient_key" value={row.key} />
          <label className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground" title="Use as 100% base">
            <input
              type="radio"
              name={BASE_INPUT_NAME}
              value={row.key}
              checked={baseKey === row.key}
              onChange={() => setBaseKey(row.key)}
            />
            100% base
          </label>
          <Field label="Ingredient" htmlFor={`ingredient-${row.key}`}>
            <Select
              id={`ingredient-${row.key}`}
              name="ingredient_item_id"
              value={row.inventory_item_id}
              onChange={(e) =>
                setRows((prev) => prev.map((r, i) => (i === index ? { ...r, inventory_item_id: e.target.value } : r)))
              }
            >
              <option value="">Select ingredient…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Weight (g)" htmlFor={`weight-${row.key}`}>
            <Input
              id={`weight-${row.key}`}
              name="ingredient_weight_grams"
              type="number"
              step="0.01"
              min="0"
              value={row.base_weight_grams}
              onChange={(e) =>
                setRows((prev) => prev.map((r, i) => (i === index ? { ...r, base_weight_grams: e.target.value } : r)))
              }
            />
          </Field>
          <div className="text-sm text-muted-foreground">{bakersPercent(row).toFixed(1)}%</div>
          <button
            type="button"
            onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
            className="text-sm text-destructive underline"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
