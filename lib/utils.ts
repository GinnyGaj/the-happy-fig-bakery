import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: number) {
  return `£${price.toFixed(2)}`;
}

export function formatDayDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

export function formatDayOnly(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", { weekday: "long" });
}

export function formatTimeOnly(timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${hour12}` : `${hour12}:${String(minutes).padStart(2, "0")}`;
}

export function currentWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 1) % 7; // days since last Sunday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
