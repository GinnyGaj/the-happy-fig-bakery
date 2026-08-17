"use client";

import { Fragment, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/types";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      `${o.customer_first_name} ${o.customer_last_name}`.toLowerCase().includes(q)
    );
  }, [orders, search]);

  function downloadCsv() {
    const header = ["Customer Name", "WhatsApp", "Items", "Quantities", "Total", "Time"];
    const rows = orders.map((o) => [
      `${o.customer_first_name} ${o.customer_last_name}`,
      o.customer_whatsapp,
      o.order_items.map((i) => i.name).join("; "),
      o.order_items.map((i) => i.quantity).join("; "),
      o.order_subtotal.toFixed(2),
      new Date(o.created_at).toLocaleString("en-GB"),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `happy_fig_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Search by customer name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 max-w-xs text-sm"
        />
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
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
                </tr>
                {expanded === order.id && (
                  <tr className="border-b border-border bg-muted/30">
                    <td colSpan={5} className="px-4 py-3 text-muted-foreground">
                      {order.special_instructions
                        ? `Notes: ${order.special_instructions}`
                        : "No special instructions."}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
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
