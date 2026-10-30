"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice, formatUKWhatsAppNumber } from "@/lib/utils";
import { deleteOrder, markReminderSent } from "@/lib/actions/orders";
import type { Order } from "@/lib/types";

const DEFAULT_REMINDER_TEMPLATE = `Hi {firstName}!

Quick reminder that your Happy Fig order will be ready for pickup today between *9:30 & 11:30 am*.

Order: {itemsSummary}
Order Total: {totalCost} (contactless payments accepted)
Pickup Address: 185 Boundary Road, N22 6AL.

*Ingredients*
Allergen Advice: Gluten (Wheat) and Dairy (Milk). Made in a kitchen with allergens.

•⁠  ⁠*Tomato Rosemary Focaccia*: Bread flour, yeast, olive oil, salt, cherry tomatoes, rosemary
•⁠  ⁠*Chocolate Chip Cookie*: ⁠Plain flour, unsalted butter, heavy cream, salt, baking soda, dark brown sugar, granulated sugar, vanilla, dark chocolate, milk chocolate, eggs
•⁠  ⁠*Cinnamon Buns*: Bread Flour, yeast, salt, sugar, butter, cinnamon, milk, vanilla essence, eggs`;

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

// Short UK-time label for display, e.g. "30 Oct, 14:21".
function formatOrderedAt(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const ORDERS_PER_PAGE = 10;

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2C6.486 2 2.004 6.482 2.004 12c0 1.85.5 3.583 1.372 5.07L2 22l5.09-1.335A9.943 9.943 0 0 0 12.004 22c5.518 0 10-4.482 10-10S17.522 2 12.004 2zm0 18.13a8.106 8.106 0 0 1-4.13-1.13l-.296-.176-3.07.805.82-2.997-.193-.308A8.106 8.106 0 0 1 3.87 12c0-4.487 3.647-8.13 8.134-8.13 4.486 0 8.13 3.643 8.13 8.13 0 4.486-3.644 8.13-8.13 8.13z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function DeliveryBadge({ order }: { order: Order }) {
  return order.wants_home_delivery ? (
    <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium">Delivery</span>
  ) : (
    <span className="text-xs text-muted-foreground">Pickup</span>
  );
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="text-sm text-muted-foreground">
      <p>
        {order.special_instructions
          ? `Notes: ${order.special_instructions}`
          : "No special instructions."}
      </p>
      {order.wants_home_delivery && (
        <>
          <p className="mt-2">
            <span className="font-medium text-foreground">Deliver to:</span>{" "}
            {order.delivery_address}
          </p>
          {order.delivery_reason && (
            <p className="mt-1">
              <span className="font-medium text-foreground">Reason:</span>{" "}
              {order.delivery_reason}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function OrdersTable({ orders, pickupSlot }: { orders: Order[]; pickupSlot: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deliveryOnly, setDeliveryOnly] = useState(false);
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
      if (deliveryOnly && !o.wants_home_delivery) return false;
      return true;
    });
  }, [orders, search, startDate, endDate, deliveryOnly]);

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

  function goToPage(p: number) {
    setPage(p);
    setExpanded(null);
  }

  function toggleExpanded(id: string) {
    setExpanded(expanded === id ? null : id);
  }

  function downloadCsv() {
    const header = [
      "Customer Name",
      "WhatsApp",
      "Item",
      "Quantity",
      "Item total cost",
      "Order time",
      "Home delivery",
      "Delivery address",
      "Delivery reason",
    ];
    const rows = filteredOrders.flatMap((o) =>
      o.order_items.map((i) => [
        `${o.customer_first_name} ${o.customer_last_name}`,
        o.customer_whatsapp,
        i.name,
        i.quantity,
        formatPrice(i.price * i.quantity),
        new Date(o.created_at).toLocaleString("en-GB"),
        o.wants_home_delivery ? "Yes" : "No",
        o.delivery_address ?? "",
        o.delivery_reason ?? "",
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

  // `labelled` shows text next to the icons, for the touch-friendly card layout.
  function renderActions(order: Order, labelled: boolean) {
    const sending = sendingId === order.id;
    const deleting = deletingId === order.id;
    const reminderLabel = order.reminder_sent ? "Reminder sent · resend" : "Send reminder";

    return (
      <div className={cn("flex items-center gap-2", labelled && "w-full")}>
        <button
          type="button"
          onClick={() => handleSendReminder(order)}
          disabled={sending}
          title={order.reminder_sent ? "Reminder sent · click to resend" : "Send WhatsApp reminder"}
          aria-label={order.reminder_sent ? "Reminder sent, click to resend" : "Send WhatsApp reminder"}
          className={cn(
            "flex items-center justify-center gap-2 rounded-full text-white transition-colors disabled:opacity-50",
            order.reminder_sent ? "bg-green-700/80 hover:bg-green-700" : "bg-green-600 hover:bg-green-700",
            labelled ? "h-11 flex-1 px-4 text-sm font-medium" : "h-8 w-8"
          )}
        >
          {sending ? <SpinnerIcon /> : order.reminder_sent ? <CheckIcon /> : <WhatsAppIcon />}
          {labelled && <span>{reminderLabel}</span>}
        </button>
        <button
          type="button"
          onClick={() => handleDelete(order)}
          disabled={deleting}
          title="Delete order"
          aria-label="Delete order"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50",
            labelled
              ? "h-11 w-11 border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              : "h-8 w-8 bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {deleting ? <SpinnerIcon /> : <TrashIcon />}
        </button>
      </div>
    );
  }

  const hasDateFilter = Boolean(startDate || endDate);

  return (
    <div className="mt-6">
      <details className="group rounded-2xl border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="text-sm font-medium">Pickup reminder message</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground group-open:hidden">
              Tap to edit the WhatsApp message sent with each reminder
            </p>
          </div>
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">
            Available placeholders: {"{firstName}"}, {"{itemsSummary}"}, {"{pickupSlot}"}, {"{totalCost}"}
          </p>
          <label htmlFor="reminder-template" className="sr-only">
            Pickup reminder message
          </label>
          <textarea
            id="reminder-template"
            value={reminderTemplate}
            onChange={(e) => setReminderTemplate(e.target.value)}
            rows={10}
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-base sm:text-sm"
          />
        </div>
      </details>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <Input
          type="search"
          placeholder="Search by customer name"
          value={search}
          onChange={(e) => updateSearch(e.target.value)}
          className="h-11 text-base lg:h-10 lg:w-56 lg:text-sm"
        />
        <div className="grid grid-cols-2 gap-3 lg:flex lg:items-end">
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            From
            <Input
              type="date"
              value={startDate}
              onChange={(e) => updateStartDate(e.target.value)}
              className="h-11 min-w-0 appearance-none px-3 text-base lg:h-10 lg:w-40 lg:text-sm"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            To
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => updateEndDate(e.target.value)}
              className="h-11 min-w-0 appearance-none px-3 text-base lg:h-10 lg:w-40 lg:text-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:contents">
          <button
            type="button"
            aria-pressed={deliveryOnly}
            onClick={() => {
              setDeliveryOnly(!deliveryOnly);
              setPage(1);
            }}
            className={cn(
              "h-10 rounded-full border px-4 text-sm transition-colors",
              deliveryOnly
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            Home delivery only
          </button>
          {hasDateFilter && (
            <button
              type="button"
              onClick={clearDateFilters}
              className="h-10 rounded-full px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Clear dates
            </button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={downloadCsv}
            className="ml-auto h-10 px-4 text-sm"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            <span>
              <span className="sm:hidden">CSV</span>
              <span className="hidden sm:inline">Download CSV</span>
            </span>
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
        {filteredOrders.length !== orders.length && ` (of ${orders.length})`}
      </p>

      {filteredOrders.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {orders.length === 0 ? "No orders yet." : "No orders match these filters."}
        </div>
      ) : (
        <>
          {/* Phone & iPad: one card per order */}
          <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:hidden">
            {paginatedOrders.map((order) => {
              const isOpen = expanded === order.id;
              return (
                <li
                  key={order.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {order.customer_first_name} {order.customer_last_name}
                      </p>
                      <a
                        href={`tel:${order.customer_whatsapp.replace(/\s/g, "")}`}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {order.customer_whatsapp}
                      </a>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium">{formatPrice(order.order_subtotal)}</p>
                      <DeliveryBadge order={order} />
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                    {order.order_items.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-3">
                        <span>{i.name}</span>
                        <span className="shrink-0 text-muted-foreground">×{i.quantity}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => toggleExpanded(order.id)}
                    aria-expanded={isOpen}
                    className="mt-3 flex items-center justify-between py-1 text-xs text-muted-foreground"
                  >
                    <span>Ordered {formatOrderedAt(order.created_at)}</span>
                    <span className="flex items-center gap-1">
                      {order.special_instructions && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                      )}
                      {isOpen ? "Hide details" : "Details"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mt-2 rounded-lg bg-muted/50 p-3">
                      <OrderDetails order={order} />
                    </div>
                  )}

                  <div className="mt-auto pt-3">{renderActions(order, true)}</div>
                </li>
              );
            })}
          </ul>

          {/* Desktop: table */}
          <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-border bg-card lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Ordered</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpanded(order.id)}
                      className="cursor-pointer border-b border-border align-top last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.customer_first_name} {order.customer_last_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{order.customer_whatsapp}</td>
                      <td className="px-4 py-3">{itemsSummary(order)}</td>
                      <td className="px-4 py-3">{formatPrice(order.order_subtotal)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatOrderedAt(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <DeliveryBadge order={order} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {renderActions(order, false)}
                      </td>
                    </tr>
                    {expanded === order.id && (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan={7} className="px-4 py-3">
                          <OrderDetails order={order} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-10 bg-transparent px-4 text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            ← Previous
          </Button>
          <p className="text-sm text-muted-foreground sm:hidden">
            Page {currentPage} of {totalPages}
          </p>
          <div className="hidden items-center gap-1 sm:flex">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                type="button"
                variant={p === currentPage ? "primary" : "ghost"}
                onClick={() => goToPage(p)}
                className={`h-9 w-9 px-0 text-sm ${
                  p === currentPage
                    ? "hover:opacity-90"
                    : "bg-transparent text-foreground hover:bg-muted/50"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-10 bg-transparent px-4 text-sm text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
