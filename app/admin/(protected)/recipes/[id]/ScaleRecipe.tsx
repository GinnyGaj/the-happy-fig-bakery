"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export function ScaleRecipeButton({
  baseYieldQty,
  baseYieldUnit,
}: {
  baseYieldQty: number | null;
  baseYieldUnit: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pendingInput, setPendingInput] = useState(searchParams.get("target") ?? "");

  const hasBaseYield = baseYieldQty != null && baseYieldQty > 0;

  const openDialog = () => {
    setPendingInput(searchParams.get("target") ?? "");
    dialogRef.current?.showModal();
  };

  const closeDialog = () => dialogRef.current?.close();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = Number(pendingInput);
    if (pendingInput.trim() === "" || Number.isNaN(parsed) || parsed <= 0) return;
    const params = new URLSearchParams(searchParams);
    params.set("target", String(parsed));
    router.push(`?${params.toString()}`);
    closeDialog();
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-9 px-4 text-sm"
        onClick={openDialog}
        disabled={!hasBaseYield}
        title={hasBaseYield ? undefined : "Add a base yield to this recipe to enable scaling"}
      >
        Scale
      </Button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-foreground backdrop:bg-black/40"
      >
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
      </dialog>
    </>
  );
}
