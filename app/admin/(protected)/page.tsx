import { getLatestPublishedMenu, getOrCreateThisWeeksMenu } from "@/lib/queries";
import { formatDayDate } from "@/lib/utils";
import { FormSettingsClient } from "./form-settings/FormSettingsClient";

export default async function AdminDashboard() {
  // Target the menu customers actually see; fall back to this week's row only
  // before anything has ever been published.
  const weeklyMenu = (await getLatestPublishedMenu()) ?? (await getOrCreateThisWeeksMenu());

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Week of {weeklyMenu.week_start_date}
        {weeklyMenu.pickup_date ? ` · Collection ${formatDayDate(weeklyMenu.pickup_date)}` : ""}
      </p>
      <FormSettingsClient weeklyMenu={weeklyMenu} />
    </div>
  );
}
