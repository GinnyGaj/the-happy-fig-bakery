"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { MenuItem } from "@/lib/types";

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
