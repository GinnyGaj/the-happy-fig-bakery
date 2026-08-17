import Link from "next/link";
import { getOrCreateThisWeeksMenu, getOrdersForWeek } from "@/lib/queries";

export default async function AdminDashboard() {
  const weeklyMenu = await getOrCreateThisWeeksMenu();
  const orders = await getOrdersForWeek(weeklyMenu.id);

  const stats = [
    { label: "Menu status", value: weeklyMenu.is_published ? "Published" : "Draft" },
    { label: "Form status", value: weeklyMenu.form_open ? "Open" : "Closed" },
    { label: "Orders this week", value: String(orders.length) },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Week of {weeklyMenu.week_start_date}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="paper rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/admin/menu" className="text-sm text-primary underline">
          Manage this week&apos;s menu
        </Link>
        <Link href="/admin/orders" className="text-sm text-primary underline">
          View orders
        </Link>
        <Link href="/admin/form-settings" className="text-sm text-primary underline">
          Open or close the order form
        </Link>
      </div>
    </div>
  );
}
