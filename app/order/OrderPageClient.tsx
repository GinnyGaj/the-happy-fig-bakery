"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/lib/cart";
import { MenuCard } from "@/components/MenuCard";
import { OrderSummary } from "@/components/OrderSummary";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { placeOrder } from "@/lib/actions/orders";
import type { MenuItem } from "@/lib/types";

export function OrderPageClient({
  weeklyMenuId,
  announcement,
  items,
  soldOutIds,
  stockByItem,
  pickupDate,
  pickupStartTime,
  pickupEndTime,
  pastPickup = false,
}: {
  weeklyMenuId: string;
  announcement: string | null;
  items: MenuItem[];
  soldOutIds: string[];
  stockByItem: Record<string, number>;
  pickupDate: string | null;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  pastPickup?: boolean;
}) {
  return (
    <CartProvider>
      <OrderPageInner
        weeklyMenuId={weeklyMenuId}
        announcement={announcement}
        items={items}
        soldOutIds={soldOutIds}
        stockByItem={stockByItem}
        pickupDate={pickupDate}
        pickupStartTime={pickupStartTime}
        pickupEndTime={pickupEndTime}
        pastPickup={pastPickup}
      />
    </CartProvider>
  );
}

function OrderPageInner({
  weeklyMenuId,
  announcement,
  items,
  soldOutIds,
  stockByItem,
  pickupDate,
  pickupStartTime,
  pickupEndTime,
  pastPickup = false,
}: {
  weeklyMenuId: string;
  announcement: string | null;
  items: MenuItem[];
  soldOutIds: string[];
  stockByItem: Record<string, number>;
  pickupDate: string | null;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  pastPickup?: boolean;
}) {
  const router = useRouter();
  const { lines } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);
  const [wantsHomeDelivery, setWantsHomeDelivery] = useState(false);
  const soldOut = new Set(soldOutIds);

  async function handleSubmit() {
    const form = document.getElementById("customer-details") as HTMLFormElement;
    const formData = new FormData(form);

    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const result = await placeOrder({
      weeklyMenuId,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      whatsapp: formData.get("whatsapp"),
      specialInstructions: formData.get("specialInstructions"),
      wantsHomeDelivery,
      deliveryAddress: wantsHomeDelivery ? formData.get("deliveryAddress") : undefined,
      deliveryReason: wantsHomeDelivery ? formData.get("deliveryReason") : undefined,
      items: lines.map((l) => ({
        item_id: l.item.id,
        name: l.item.name,
        quantity: l.quantity,
        price: l.item.price,
      })),
    });

    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      setErrors(result.fieldErrors ?? {});
      return;
    }

    if (result.orderId) {
      const params = new URLSearchParams({
        name: (formData.get("firstName") as string) ?? "",
        whatsapp: (formData.get("whatsapp") as string) ?? "",
        subtotal: lines
          .reduce((sum, l) => sum + l.item.price * l.quantity, 0)
          .toFixed(2),
        items: lines.map((l) => `${l.item.name}|${l.quantity}|${l.item.price}`).join(","),
        ...(pickupDate ? { pickupDate } : {}),
      });
      router.push(`/confirmation?${params.toString()}`);
    }
  }

  return (
    <>
      {!pastPickup && announcement && (
        <p className="mt-4 rounded-lg bg-accent px-4 py-3 text-base font-medium">{announcement}</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            soldOut={soldOut.has(item.id)}
            remainingStock={item.id in stockByItem ? stockByItem[item.id] : null}
            pastPickup={pastPickup}
          />
        ))}
      </div>

      <div className="mt-14 max-w-2xl">
        <h2 className="text-2xl">Your details</h2>
        {formError && <p className="mt-3 text-base text-destructive">{formError}</p>}
        <form id="customer-details" className="mt-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="First name"
              htmlFor="firstName"
              error={errors.firstName}
              labelClassName="text-base font-medium text-foreground"
              errorClassName="text-base text-destructive"
            >
              <Input
                id="firstName"
                name="firstName"
                required
                autoComplete="given-name"
                className="text-lg"
              />
            </Field>
            <Field
              label="Last name"
              htmlFor="lastName"
              error={errors.lastName}
              labelClassName="text-base font-medium text-foreground"
              errorClassName="text-base text-destructive"
            >
              <Input
                id="lastName"
                name="lastName"
                required
                autoComplete="family-name"
                className="text-lg"
              />
            </Field>
          </div>
          <Field
            label="WhatsApp number"
            htmlFor="whatsapp"
            error={errors.whatsapp}
            labelClassName="text-base font-medium text-foreground"
            errorClassName="text-base text-destructive"
          >
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              required
              autoComplete="tel"
              className="text-lg"
            />
          </Field>
          <Field
            label="Special instructions (optional)"
            htmlFor="specialInstructions"
            error={errors.specialInstructions}
            labelClassName="text-base font-medium text-foreground"
            errorClassName="text-base text-destructive"
          >
            <Textarea id="specialInstructions" name="specialInstructions" className="text-lg" />
          </Field>

          <label className="flex items-start gap-2 text-base">
            <input
              type="checkbox"
              checked={wantsHomeDelivery}
              onChange={(e) => setWantsHomeDelivery(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              I need home delivery (only for customers who genuinely can&apos;t collect their
              order — disability, young children, etc.)
            </span>
          </label>

          {wantsHomeDelivery && (
            <>
              <Field
                label="Delivery address"
                htmlFor="deliveryAddress"
                error={errors.deliveryAddress}
                labelClassName="text-base font-medium text-foreground"
                errorClassName="text-base text-destructive"
              >
                <Textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  required
                  className="text-lg"
                />
              </Field>
              <Field
                label="Quick reason for delivery"
                htmlFor="deliveryReason"
                error={errors.deliveryReason}
                labelClassName="text-base font-medium text-foreground"
                errorClassName="text-base text-destructive"
              >
                <Input
                  id="deliveryReason"
                  name="deliveryReason"
                  required
                  maxLength={80}
                  placeholder="e.g. mobility difficulties, caring for a newborn…"
                  className="text-lg"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  A short note helps us keep delivery available for neighbours who really need
                  it.
                </p>
              </Field>
            </>
          )}
        </form>
      </div>

      <div className="mt-14 max-w-2xl">
        <OrderSummary
          submitting={submitting}
          onSubmit={handleSubmit}
          pickupDate={pickupDate}
          pickupStartTime={pickupStartTime}
          pickupEndTime={pickupEndTime}
          pickupConfirmed={pickupConfirmed}
          onPickupConfirmedChange={setPickupConfirmed}
          wantsHomeDelivery={wantsHomeDelivery}
        />
      </div>
    </>
  );
}
