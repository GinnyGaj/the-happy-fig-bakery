import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number) {
  return `£${price.toFixed(2)}`;
}

export function currentWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 1) % 7; // days since last Sunday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
