"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";
import { useCartIfAvailable } from "@/lib/cart";
import type { MenuItem } from "@/lib/types";

const MAX_QTY = 10;

export function MenuCard({
  item,
  soldOut = false,
  readOnly = false,
  remainingStock = null,
}: {
  item: MenuItem;
  soldOut?: boolean;
  readOnly?: boolean;
  remainingStock?: number | null;
}) {
  const cart = useCartIfAvailable();
  const current = cart?.lines.find((l) => l.item.id === item.id)?.quantity ?? 0;
  const baseMaxQty =
    remainingStock === null ? MAX_QTY : Math.max(0, Math.min(MAX_QTY, remainingStock));
  const otherItemsQty =
    cart?.lines.reduce((sum, l) => (l.item.id === item.id ? sum : sum + l.quantity), 0) ?? 0;
  const freeItemUnlocked = otherItemsQty >= 2;
  const maxQty = item.is_free_item ? (freeItemUnlocked ? Math.min(1, baseMaxQty) : 0) : baseMaxQty;

  return (
    <div
      className={`paper flex flex-col overflow-hidden rounded-2xl border border-border bg-card ${
        soldOut ? "opacity-50 grayscale" : ""
      }`}
    >
      <div className="relative aspect-4/3 w-full bg-muted">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            fresh from the oven
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xl">{item.name}</h3>
          <span className="whitespace-nowrap text-base text-foreground">
            {formatPrice(item.price)}
          </span>
        </div>
        {(item.dietary_tags.length > 0 || (item.is_free_item && !soldOut)) && (
          <div className="flex flex-wrap gap-1.5">
            {item.is_free_item && !soldOut && <Badge>Free</Badge>}
            {item.dietary_tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
        {item.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        )}
        {item.is_free_item && !soldOut && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add any two items to your cart and claim this sweet treat on us.
          </p>
        )}
        <div className="mt-auto pt-3">
          {soldOut ? (
            <Badge variant="outline">Sold out</Badge>
          ) : !readOnly ? (
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Quantity
                <Select
                  value={current}
                  onChange={(e) => cart?.setQuantity(item, Number(e.target.value))}
                  className="w-20"
                  disabled={item.is_free_item && !freeItemUnlocked}
                >
                  {Array.from({ length: maxQty + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </label>
              {item.is_free_item && !freeItemUnlocked && (
                <span className="text-xs text-muted-foreground">
                  Add {2 - otherItemsQty} more item{2 - otherItemsQty === 1 ? "" : "s"} to unlock
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
