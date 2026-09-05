import { getOrCreateThisWeeksMenu, getAllOrders } from "@/lib/queries";
import { formatTimeOnly } from "@/lib/utils";
import { OrdersTable } from "./OrdersTable";

function formatPickupSlot(startTime: string | null, endTime: string | null) {
  if (!startTime || !endTime) return "";
  const meridiem = (time: string) => (Number(time.slice(0, 2)) < 12 ? "am" : "pm");
  return `${formatTimeOnly(startTime)}${meridiem(startTime)}–${formatTimeOnly(endTime)}${meridiem(endTime)}`;
}

export default async function AdminOrdersPage() {
  const weeklyMenu = await getOrCreateThisWeeksMenu();
  const orders = await getAllOrders();
  const pickupSlot = formatPickupSlot(weeklyMenu.pickup_start_time, weeklyMenu.pickup_end_time);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">Orders</h1>
      <OrdersTable orders={orders} pickupSlot={pickupSlot} />
    </div>
  );
}
