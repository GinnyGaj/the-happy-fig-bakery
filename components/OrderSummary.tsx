"use client";

import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function OrderSummary({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { lines, remove, subtotal } = useCart();

  return (
    <div className="paper rounded-2xl border border-border bg-muted/50 p-5">
      <h2 className="text-xl">Your order</h2>
      {lines.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing selected yet</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {lines.map((line) => (
            <li key={line.item.id} className="flex items-center justify-between text-sm">
              <span>
                {line.item.name} × {line.quantity}
              </span>
              <span className="flex items-center gap-3">
                {formatPrice(line.item.price * line.quantity)}
                <button
                  type="button"
                  onClick={() => remove(line.item.id)}
                  className="text-muted-foreground underline transition-colors hover:text-primary"
                >
                  remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between text-base font-medium">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>
      <Button
        type="button"
        onClick={onSubmit}
        disabled={lines.length === 0 || submitting}
        className="mt-5 w-full"
      >
        {submitting ? "Placing your order…" : "Place My Order"}
      </Button>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        No account needed. You&apos;ll see a confirmation message.
      </p>
    </div>
  );
}
