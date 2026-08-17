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
}: {
  item: MenuItem;
  soldOut?: boolean;
  readOnly?: boolean;
}) {
  const cart = useCartIfAvailable();
  const current = cart?.lines.find((l) => l.item.id === item.id)?.quantity ?? 0;

  return (
    <div className="paper flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
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
        {item.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.dietary_tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
        {item.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-auto pt-3">
          {soldOut ? (
            <Badge variant="outline">Sold out</Badge>
          ) : !readOnly ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Quantity
              <Select
                value={current}
                onChange={(e) => cart?.setQuantity(item, Number(e.target.value))}
                className="w-20"
              >
                {Array.from({ length: MAX_QTY + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
