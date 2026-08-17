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
}: {
  weeklyMenuId: string;
  announcement: string | null;
  items: MenuItem[];
  soldOutIds: string[];
}) {
  return (
    <CartProvider>
      <OrderPageInner
        weeklyMenuId={weeklyMenuId}
        announcement={announcement}
        items={items}
        soldOutIds={soldOutIds}
      />
    </CartProvider>
  );
}

function OrderPageInner({
  weeklyMenuId,
  announcement,
  items,
  soldOutIds,
}: {
  weeklyMenuId: string;
  announcement: string | null;
  items: MenuItem[];
  soldOutIds: string[];
}) {
  const router = useRouter();
  const { lines } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
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
      });
      router.push(`/confirmation?${params.toString()}`);
    }
  }

  return (
    <>
      {announcement && (
        <p className="mt-4 rounded-lg bg-accent px-4 py-3 text-sm">{announcement}</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <MenuCard key={item.id} item={item} soldOut={soldOut.has(item.id)} />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary submitting={submitting} onSubmit={handleSubmit} />
        </div>
      </div>

      <div className="mt-14 max-w-2xl">
        <h2 className="text-2xl">Your details</h2>
        {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}
        <form id="customer-details" className="mt-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName" error={errors.firstName}>
              <Input id="firstName" name="firstName" required autoComplete="given-name" />
            </Field>
            <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
              <Input id="lastName" name="lastName" required autoComplete="family-name" />
            </Field>
          </div>
          <Field label="WhatsApp number" htmlFor="whatsapp" error={errors.whatsapp}>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              required
              autoComplete="tel"
              placeholder="07123 456789"
            />
          </Field>
          <Field
            label="Special instructions (optional)"
            htmlFor="specialInstructions"
            error={errors.specialInstructions}
          >
            <Textarea id="specialInstructions" name="specialInstructions" />
          </Field>
        </form>
      </div>
    </>
  );
}
