"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@/lib/types";

const FREE_BAKE_UNLOCK_THRESHOLD = 3;

export interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  setQuantity: (item: MenuItem, quantity: number) => void;
  remove: (itemId: string) => void;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const setQuantity = (item: MenuItem, quantity: number) => {
    setLines((prev) => {
      const rest = prev.filter((l) => l.item.id !== item.id);
      if (quantity <= 0) return rest;
      return [...rest, { item, quantity }];
    });
  };

  const remove = (itemId: string) => {
    setLines((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0),
    [lines]
  );

  useEffect(() => {
    const paidQty = lines.reduce(
      (sum, l) => (l.item.is_free_item ? sum : sum + l.quantity),
      0
    );
    if (paidQty >= FREE_BAKE_UNLOCK_THRESHOLD) return;
    if (!lines.some((l) => l.item.is_free_item)) return;
    setLines((prev) => prev.filter((l) => !l.item.is_free_item));
  }, [lines]);

  return (
    <CartContext.Provider value={{ lines, setQuantity, remove, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export function useCartIfAvailable() {
  return useContext(CartContext);
}
