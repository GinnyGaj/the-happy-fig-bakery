"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatUKWhatsAppNumber } from "@/lib/utils";
import { deleteOrder, markReminderSent } from "@/lib/actions/orders";
import type { Order } from "@/lib/types";

const DEFAULT_REMINDER_TEMPLATE =
  "Hi {firstName}! 🥖 Quick reminder that your Happy Fig order ({itemsSummary}) is ready for pickup today during your slot ({pickupSlot}) at our doorstep on Boundary Road. Total: {totalCost}.";

function itemsSummary(order: Order) {
  return order.order_items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
}

function compileReminderMessage(order: Order, template: string, pickupSlot: string) {
  return template
    .replaceAll("{firstName}", order.customer_first_name)
    .replaceAll("{itemsSummary}", itemsSummary(order))
    .replaceAll("{pickupSlot}", pickupSlot)
    .replaceAll("{totalCost}", formatPrice(order.order_subtotal));
}

// Returns the order's date as YYYY-MM-DD in UK local time, matching the "Ordered" column.
function ukDateString(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date(iso));
}

const ORDERS_PER_PAGE = 10;

export function OrdersTable({ orders, pickupSlot }: { orders: Order[]; pickupSlot: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [reminderTemplate, setReminderTemplate] = useState(DEFAULT_REMINDER_TEMPLATE);

  async function handleSendReminder(order: Order) {
    const message = compileReminderMessage(order, reminderTemplate, pickupSlot);
    const phone = formatUKWhatsAppNumber(order.customer_whatsapp);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");

    setSendingId(order.id);
    const result = await markReminderSent(order.id);
    setSendingId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    router.refresh();
  }

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

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStartDate(value: string) {
    setStartDate(value);
    setPage(1);
  }

  function updateEndDate(value: string) {
    setEndDate(value);
    setPage(1);
  }

  function clearDateFilters() {
    setStartDate("");
    setEndDate("");
    setPage(1);
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
      <div className="rounded-2xl border border-border bg-card p-4">
        <label htmlFor="reminder-template" className="text-sm font-medium">
          Pickup reminder message
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Available placeholders: {"{firstName}"}, {"{itemsSummary}"}, {"{pickupSlot}"}, {"{totalCost}"}
        </p>
        <textarea
          id="reminder-template"
          value={reminderTemplate}
          onChange={(e) => setReminderTemplate(e.target.value)}
          rows={3}
          className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm"
        />
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Input
            placeholder="Search by customer name"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="h-10 w-full text-sm sm:w-56"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
              From
              <Input
                type="date"
                value={startDate}
                onChange={(e) => updateStartDate(e.target.value)}
                className="h-10 w-full text-sm sm:w-auto"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
              To
              <Input
                type="date"
                value={endDate}
                onChange={(e) => updateEndDate(e.target.value)}
                className="h-10 w-full text-sm sm:w-auto"
              />
            </label>
          </div>
          {(startDate || endDate) && (
            <Button
              type="button"
              onClick={clearDateFilters}
              className="h-10 w-full bg-transparent px-3 text-sm text-muted-foreground hover:bg-muted/50 sm:w-auto"
            >
              Clear
            </Button>
          )}
        </div>
        <Button type="button" onClick={downloadCsv} className="h-10 w-full px-5 text-sm sm:w-auto">
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
            {paginatedOrders.map((order) => (
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
                    <div className="flex flex-nowrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendReminder(order)}
                        disabled={sendingId === order.id}
                        title={
                          order.reminder_sent
                            ? "Reminder sent · click to resend"
                            : "Send WhatsApp reminder"
                        }
                        aria-label={
                          order.reminder_sent
                            ? "Reminder sent, click to resend"
                            : "Send WhatsApp reminder"
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                      >
                        {sendingId === order.id ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : order.reminder_sent ? (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12.004 2C6.486 2 2.004 6.482 2.004 12c0 1.85.5 3.583 1.372 5.07L2 22l5.09-1.335A9.943 9.943 0 0 0 12.004 22c5.518 0 10-4.482 10-10S17.522 2 12.004 2zm0 18.13a8.106 8.106 0 0 1-4.13-1.13l-.296-.176-3.07.805.82-2.997-.193-.308A8.106 8.106 0 0 1 3.87 12c0-4.487 3.647-8.13 8.134-8.13 4.486 0 8.13 3.643 8.13 8.13 0 4.486-3.644 8.13-8.13 8.13z" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(order)}
                        disabled={deletingId === order.id}
                        title="Delete order"
                        aria-label="Delete order"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                      >
                        {deletingId === order.id ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        )}
                      </button>
                    </div>
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

      {filteredOrders.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ORDERS_PER_PAGE + 1}–
            {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 bg-transparent px-3 text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === currentPage ? "primary" : "ghost"}
                onClick={() => setPage(p)}
                className={`h-9 w-9 px-0 text-sm ${
                  p === currentPage
                    ? "hover:opacity-90"
                    : "bg-transparent text-foreground hover:bg-muted/50"
                }`}
              >
                {p}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 bg-transparent px-3 text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
