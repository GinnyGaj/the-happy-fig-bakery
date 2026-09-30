import { getOrdersForPickupDate, getMadeQuantitiesForPickupDate } from "@/lib/queries";
import { CollectionsView } from "./CollectionsView";

function todayUk() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}

export default async function AdminCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const pickupDate = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayUk();

  const [orders, madeQuantities] = await Promise.all([
    getOrdersForPickupDate(pickupDate),
    getMadeQuantitiesForPickupDate(pickupDate),
  ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">Collections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track extras, record collections, and see what&apos;s still pending for a collection day.
      </p>
      <CollectionsView pickupDate={pickupDate} orders={orders} madeQuantities={madeQuantities} />
    </div>
  );
}
