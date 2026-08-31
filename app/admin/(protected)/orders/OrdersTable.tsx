"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { deleteOrder } from "@/lib/actions/orders";
import type { Order } from "@/lib/types";

// Returns the order's date as YYYY-MM-DD in UK local time, matching the "Ordered" column.
function ukDateString(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(iso));
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(order: Order) {
    const confirmed = window.confirm(
      `Delete the order from ${order.customer_first_name} ${order.customer_last_name}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(order.id);
    const result = await deleteOrder(order.id);
    setDeletingId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (q && !`${o.customer_first_name} ${o.customer_last_name}`.toLowerCase().includes(q)) {
        return false;
      }
      if (startDate) {
        const orderDate = ukDateString(o.created_at);
        if (endDate) {
          if (orderDate < startDate || orderDate > endDate) return false;
        } else if (orderDate !== startDate) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search, startDate, endDate]);

  function clearDateFilters() {
    setStartDate("");
    setEndDate("");
  }

  function downloadCsv() {
    const header = ["Customer Name", "WhatsApp", "Item", "Quantity", "Item total cost", "Order time"];
    const rows = filteredOrders.flatMap((o) =>
      o.order_items.map((i) => [
        `${o.customer_first_name} ${o.customer_last_name}`,
        o.customer_whatsapp,
        i.name,
        i.quantity,
        formatPrice(i.price * i.quantity),
        new Date(o.created_at).toLocaleString("en-GB"),
      ])
    );

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    let filename: string;
    if (startDate && endDate) {
      filename = `orders_${startDate}_to_${endDate}.csv`;
    } else if (startDate) {
      filename = `orders_${startDate}.csv`;
    } else {
      filename = `happy_fig_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    }
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search by customer name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-xs text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            From
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            To
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 text-sm"
            />
          </label>
          {(startDate || endDate) && (
            <Button
              type="button"
              onClick={clearDateFilters}
              className="h-10 bg-transparent px-3 text-sm text-muted-foreground hover:bg-muted/50"
            >
              Clear
            </Button>
          )}
        </div>
        <Button type="button" onClick={downloadCsv} className="h-10 px-5 text-sm">
          Download Orders as CSV
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Ordered</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <Fragment key={order.id}>
                <tr
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    {order.customer_first_name} {order.customer_last_name}
                  </td>
                  <td className="px-4 py-3">{order.customer_whatsapp}</td>
                  <td className="px-4 py-3">
                    {order.order_items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.order_subtotal)}</td>
                  <td className="px-4 py-3">
                    {new Date(order.created_at).toLocaleString("en-GB")}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      onClick={() => handleDelete(order)}
                      disabled={deletingId === order.id}
                      className="h-8 bg-destructive px-3 text-xs text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletingId === order.id ? "Deleting..." : "Delete"}
                    </Button>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr className="border-b border-border bg-muted/30">
                    <td colSpan={6} className="px-4 py-3 text-muted-foreground">
                      {order.special_instructions
                        ? `Notes: ${order.special_instructions}`
                        : "No special instructions."}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
