"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import {
  markOrderCollected,
  unmarkOrderCollected,
  setOrderComingLater,
  upsertMadeQuantity,
} from "@/lib/actions/collections";
import type { DailyMadeQuantity, Order, PaymentMethod } from "@/lib/types";

function customerName(order: Order) {
  return `${order.customer_first_name} ${order.customer_last_name}`;
}

function itemsSummary(order: Order) {
  return order.order_items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
}

export function CollectionsView({
  pickupDate,
  orders,
  madeQuantities,
}: {
  pickupDate: string;
  orders: Order[];
  madeQuantities: DailyMadeQuantity[];
}) {
  const router = useRouter();
  const [dateInput, setDateInput] = useState(pickupDate);
  const [hideComingLater, setHideComingLater] = useState(false);
  const [search, setSearch] = useState("");
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const orderedByItem = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.order_items) {
        totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity);
      }
    }
    return totals;
  }, [orders]);

  const madeByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of madeQuantities) {
      map.set(row.item_name, row.made_quantity);
    }
    return map;
  }, [madeQuantities]);

  const collectedByItem = useMemo(() => {
    const totals = new Map<string, number>();
    for (const order of orders) {
      if (order.status !== "collected") continue;
      for (const item of order.order_items) {
        totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity);
      }
    }
    return totals;
  }, [orders]);

  const itemNames = useMemo(() => {
    const names = new Set<string>([...orderedByItem.keys(), ...madeByItem.keys()]);
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [orderedByItem, madeByItem]);

  const searchQuery = search.trim().toLowerCase();
  const matchesSearch = (order: Order) =>
    !searchQuery || customerName(order).toLowerCase().includes(searchQuery);

  const pendingOrders = orders.filter((o) => o.status !== "collected" && matchesSearch(o));
  const visiblePendingOrders = hideComingLater
    ? pendingOrders.filter((o) => !o.coming_later)
    : pendingOrders;

  const collectedOrders = orders.filter((o) => o.status === "collected" && matchesSearch(o));

  const expectedRevenue = orders.reduce((sum, o) => sum + o.order_subtotal, 0);
  const collectedRevenue = orders
    .filter((o) => o.status === "collected" && o.payment_method !== "free")
    .reduce((sum, o) => sum + o.order_subtotal, 0);

  function goToDate(next: string) {
    router.push(`/admin/collections?date=${next}`);
  }

  async function handleMadeQuantityChange(itemName: string, value: string) {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0) return;

    setSavingItem(itemName);
    const result = await upsertMadeQuantity({ pickupDate, itemName, madeQuantity: parsed });
    setSavingItem(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleToggleComingLater(order: Order) {
    setBusyId(order.id);
    const result = await setOrderComingLater(order.id, !order.coming_later);
    setBusyId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  async function handleUndoCollected(order: Order) {
    const confirmed = window.confirm(`Undo collection for ${customerName(order)}?`);
    if (!confirmed) return;

    setBusyId(order.id);
    const result = await unmarkOrderCollected(order.id);
    setBusyId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm text-muted-foreground">
          Collection day
          <Input
            type="date"
            value={dateInput}
            onChange={(e) => {
              setDateInput(e.target.value);
              goToDate(e.target.value);
            }}
            className="h-10 w-full text-sm sm:w-auto"
          />
        </label>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-lg font-medium">Revenue</h2>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected</p>
            <p className="text-2xl">{formatPrice(expectedRevenue)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected</p>
            <p className="text-2xl">{formatPrice(collectedRevenue)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Collected excludes orders paid as &quot;Free&quot;.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-medium">Made vs. ordered</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Remaining to collect</th>
                <th className="px-4 py-3">Extras</th>
                <th className="px-4 py-3">Ordered</th>
                <th className="px-4 py-3">Made</th>
              </tr>
            </thead>
            <tbody>
              {itemNames.map((name) => {
                const ordered = orderedByItem.get(name) ?? 0;
                const made = madeByItem.get(name) ?? 0;
                const extras = made - ordered;
                const remaining = ordered - (collectedByItem.get(name) ?? 0);
                return (
                  <tr key={name} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{name}</td>
                    <td className="px-4 py-3 font-medium">{remaining}</td>
                    <td
                      className={`px-4 py-3 font-medium ${
                        extras < 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {extras}
                    </td>
                    <td className="px-4 py-3">{ordered}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        defaultValue={made}
                        disabled={savingItem === name}
                        onBlur={(e) => handleMadeQuantityChange(name, e.target.value)}
                        className="h-9 w-24 text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
              {itemNames.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No orders for this collection day yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Pending collections</h2>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={hideComingLater}
              onChange={(e) => setHideComingLater(e.target.checked)}
            />
            Hide &quot;coming later&quot;
          </label>
        </div>
        <Input
          type="text"
          placeholder="Search by customer name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-3 h-10 w-full text-sm sm:w-56"
        />
        <div className="mt-3 flex flex-col gap-3">
          {visiblePendingOrders.map((order) => (
            <PendingOrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onToggleComingLater={() => handleToggleComingLater(order)}
              onCollected={() => router.refresh()}
              collecting={collectingId === order.id}
              setCollecting={(v) => setCollectingId(v ? order.id : null)}
            />
          ))}
          {visiblePendingOrders.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nothing pending.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium">Collected today</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Collected at</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collectedOrders
                .map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{customerName(order)}</td>
                    <td className="px-4 py-3">{itemsSummary(order)}</td>
                    <td className="px-4 py-3 capitalize">{order.payment_method}</td>
                    <td className="px-4 py-3">
                      {order.collected_at
                        ? new Date(order.collected_at).toLocaleTimeString("en-GB")
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.collection_notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busyId === order.id}
                        onClick={() => handleUndoCollected(order)}
                        className="h-8 bg-transparent px-3 text-xs text-muted-foreground hover:bg-muted/50"
                      >
                        Undo
                      </Button>
                    </td>
                  </tr>
                ))}
              {collectedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Nothing collected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PendingOrderCard({
  order,
  busy,
  onToggleComingLater,
  onCollected,
  collecting,
  setCollecting,
}: {
  order: Order;
  busy: boolean;
  onToggleComingLater: () => void;
  onCollected: () => void;
  collecting: boolean;
  setCollecting: (v: boolean) => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [collectedBy, setCollectedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    const result = await markOrderCollected({
      orderId: order.id,
      paymentMethod,
      collectedBy,
      notes,
    });
    setSaving(false);

    if (result.error) {
      window.alert(result.error);
      return;
    }
    setCollecting(false);
    onCollected();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {order.customer_first_name} {order.customer_last_name}
            {order.coming_later && (
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Coming later
              </span>
            )}
          </p>
          <p className="text-muted-foreground">{itemsSummary(order)}</p>
          <p className="text-sm text-muted-foreground">{formatPrice(order.order_subtotal)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onToggleComingLater}
            className="h-9 bg-transparent px-3 text-xs text-muted-foreground hover:bg-muted/50"
          >
            {order.coming_later ? "Unmark coming later" : "Mark coming later"}
          </Button>
          <Button
            type="button"
            onClick={() => setCollecting(!collecting)}
            className="h-9 px-4 text-xs"
          >
            {collecting ? "Cancel" : "Mark collected"}
          </Button>
        </div>
      </div>

      {collecting && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            Payment
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full sm:w-32"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="free">Free</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            Collected by
            <Input
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              placeholder="Optional"
              className="h-10 w-full text-sm sm:w-48"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
            Notes
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Discount given, new customer, feedback..."
              rows={2}
              className="w-full text-sm"
            />
          </label>
          <Button
            type="button"
            onClick={handleSubmit}
            loading={saving}
            className="h-10 px-5 text-sm"
          >
            Confirm collection
          </Button>
        </div>
      )}
    </div>
  );
}
