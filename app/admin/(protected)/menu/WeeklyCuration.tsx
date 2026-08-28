"use client";

import { useState, useTransition } from "react";
import { publishWeeklyMenu, updateItemMaxLimit } from "@/lib/actions/menu";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { MenuItem, WeeklyMenu } from "@/lib/types";

export function WeeklyCuration({
  items,
  weeklyMenu,
}: {
  items: MenuItem[];
  weeklyMenu: WeeklyMenu;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(weeklyMenu.menu_item_ids ?? [])
  );
  const [pickupDate, setPickupDate] = useState(weeklyMenu.pickup_date ?? "");
  const [pickupStartTime, setPickupStartTime] = useState(weeklyMenu.pickup_start_time ?? "");
  const [pickupEndTime, setPickupEndTime] = useState(weeklyMenu.pickup_end_time ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(weeklyMenu.published_at);
  const [maxLimits, setMaxLimits] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.id, item.max_limit != null ? String(item.max_limit) : ""]))
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      for (const item of items) {
        const raw = maxLimits[item.id] ?? "";
        const nextLimit = raw.trim() === "" ? null : Number(raw);
        if (nextLimit !== (item.max_limit ?? null)) {
          await updateItemMaxLimit(item.id, nextLimit);
        }
      }
      await publishWeeklyMenu(
        weeklyMenu.week_start_date,
        Array.from(selected),
        pickupDate || null,
        pickupStartTime || null,
        pickupEndTime || null
      );
      setSavedAt(new Date().toISOString());
    });
  }

  return (
    <section>
      <h2 className="text-xl">
        This week&apos;s menu {weeklyMenu.is_published ? "(Published)" : "(Draft)"}
      </h2>
      <p className="text-sm text-muted-foreground">Week of {weeklyMenu.week_start_date}</p>
      <p className="mt-1 text-sm text-muted-foreground">Guidance: 2 fixed + 1 rotating</p>

      <label className="mt-4 flex max-w-xs flex-col gap-1 text-sm">
        Pickup date
        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3"
        />
      </label>

      <div className="mt-4 flex max-w-xs gap-4">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Pickup start time
          <input
            type="time"
            value={pickupStartTime}
            onChange={(e) => setPickupStartTime(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Pickup end time
          <input
            type="time"
            value={pickupEndTime}
            onChange={(e) => setPickupEndTime(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Add items to your library below first.</p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <label className="flex flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 accent-primary"
              />
              {item.name}
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Max/week
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Unlimited"
                value={maxLimits[item.id] ?? ""}
                onChange={(e) =>
                  setMaxLimits((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                className="h-8 w-24 rounded-lg border border-border bg-background px-2"
              />
            </label>
            <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Button type="button" onClick={handleSave} disabled={pending} className="h-10 px-5 text-sm">
          {pending ? "Updating…" : "Update Menu"}
        </Button>
        {savedAt && (
          <p className="text-sm text-muted-foreground">
            Last published {new Date(savedAt).toLocaleString("en-GB")}
          </p>
        )}
      </div>
    </section>
  );
}
