import { getOrCreateThisWeeksMenu } from "@/lib/queries";
import { FormSettingsClient } from "./form-settings/FormSettingsClient";

export default async function AdminDashboard() {
  const weeklyMenu = await getOrCreateThisWeeksMenu();

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Week of {weeklyMenu.week_start_date}
      </p>
      <FormSettingsClient weeklyMenu={weeklyMenu} />
    </div>
  );
}
