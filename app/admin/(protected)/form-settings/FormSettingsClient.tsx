"use client";

import { useState, useTransition } from "react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setFormOpen, setAnnouncement } from "@/lib/actions/menu";
import type { WeeklyMenu } from "@/lib/types";

export function FormSettingsClient({ weeklyMenu }: { weeklyMenu: WeeklyMenu }) {
  const [open, setOpen] = useState(weeklyMenu.form_open);
  const [announcement, setAnnouncementText] = useState(weeklyMenu.announcement_message ?? "");
  const [toggledAt, setToggledAt] = useState<string | null>(weeklyMenu.updated_at);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !open;
    startTransition(async () => {
      await setFormOpen(weeklyMenu.id, next);
      setOpen(next);
      setToggledAt(new Date().toISOString());
    });
  }

  function saveAnnouncement() {
    startTransition(async () => {
      await setAnnouncement(weeklyMenu.id, announcement);
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section className="paper rounded-2xl border border-border bg-card p-6">
        <p className="text-lg">
          Orders are <span className="text-primary">{open ? "OPEN" : "CLOSED"}</span>
        </p>
        {toggledAt && (
          <p className="mt-1 text-sm text-muted-foreground">
            Last changed {new Date(toggledAt).toLocaleString("en-GB")}
          </p>
        )}
        <Button
          type="button"
          onClick={toggle}
          disabled={pending}
          variant={open ? "secondary" : "primary"}
          className="mt-4 h-10 px-5 text-sm"
        >
          {open ? "Close orders" : "Open orders"}
        </Button>
      </section>

      <section>
        <h2 className="text-xl">Announcement banner</h2>
        <p className="text-sm text-muted-foreground">
          Shown above the menu on the order page.
        </p>
        <Field label="Message" htmlFor="announcement">
          <Input
            id="announcement"
            value={announcement}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="New this week: Almond Croissant!"
          />
        </Field>
        <Button
          type="button"
          onClick={saveAnnouncement}
          disabled={pending}
          className="mt-4 h-10 px-5 text-sm"
        >
          Save
        </Button>
      </section>
    </div>
  );
}
