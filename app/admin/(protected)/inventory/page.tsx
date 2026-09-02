import { ButtonLink } from "@/components/ui/Button";
import { getAllBatches, getInventoryItems, getInventoryWithStock } from "@/lib/inventory-queries";
import { InventoryTable } from "./InventoryTable";
import { LogPurchaseForm } from "./LogPurchaseForm";

export default async function InventoryPage() {
  const [stock, batches, items] = await Promise.all([
    getInventoryWithStock(),
    getAllBatches(),
    getInventoryItems(),
  ]);

  return (
    <div className="flex max-w-5xl flex-col gap-12">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl">Inventory & Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track ingredients and consumables, log purchases, and audit stock after a bake.
          </p>
        </div>
        <ButtonLink href="/admin/inventory/audit" variant="secondary" className="h-10 px-5 text-sm">
          Quick Post-Bake Audit
        </ButtonLink>
      </div>

      <InventoryTable stock={stock} batches={batches} items={items} />
      <LogPurchaseForm items={items} />
    </div>
  );
}
