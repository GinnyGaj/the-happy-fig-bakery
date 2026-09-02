import { getInventoryWithStock } from "@/lib/inventory-queries";
import { AuditChecklist } from "./AuditChecklist";

export default async function InventoryAuditPage() {
  const stock = await getInventoryWithStock();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl">Post-Bake Audit</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter how much of each item is left right now — usage is calculated automatically.
      </p>
      <AuditChecklist items={stock} />
    </div>
  );
}
