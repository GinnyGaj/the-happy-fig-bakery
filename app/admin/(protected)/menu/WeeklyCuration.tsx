"use client";

import { useState, useTransition } from "react";
import { publishWeeklyMenu } from "@/lib/actions/menu";
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
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<string | null>(weeklyMenu.published_at);

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
      await publishWeeklyMenu(weeklyMenu.week_start_date, Array.from(selected));
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

      <div className="mt-4 flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Add items to your library below first.</p>
        )}
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="h-4 w-4 accent-primary"
              />
              {item.name}
            </span>
            <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
          </label>
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
