import { getOrCreateThisWeeksMenu, getOrdersForWeek } from "@/lib/queries";
import { OrdersTable } from "./OrdersTable";

export default async function AdminOrdersPage() {
  const weeklyMenu = await getOrCreateThisWeeksMenu();
  const orders = await getOrdersForWeek(weeklyMenu.id);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Week of {weeklyMenu.week_start_date}</p>
      <OrdersTable orders={orders} />
    </div>
  );
}
