import { getAllMenuItems, getOrCreateThisWeeksMenu } from "@/lib/queries";
import { ItemLibrary } from "./ItemLibrary";
import { WeeklyCuration } from "./WeeklyCuration";

export default async function AdminMenuPage() {
  const [items, weeklyMenu] = await Promise.all([
    getAllMenuItems(),
    getOrCreateThisWeeksMenu(),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <div>
        <h1 className="text-3xl">Menu management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add bakes to your library, then choose which ones appear this week.
        </p>
      </div>

      <WeeklyCuration items={items} weeklyMenu={weeklyMenu} />
      <ItemLibrary items={items} />
    </div>
  );
}
