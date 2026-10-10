import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { MenuCard } from "@/components/MenuCard";
import { getCurrentWeeklyMenu, getFullMenu } from "@/lib/queries";
import { formatDayDate, formatTimeOnly, isPastDate, nextSaturday } from "@/lib/utils";
import { OrderPageClient } from "./order/OrderPageClient";
import type { MenuItem } from "@/lib/types";

export default async function Home() {
  const { weeklyMenu, items, stock } = await getCurrentWeeklyMenu();
  const formOpen = Boolean(weeklyMenu?.form_open);
  const fullMenu = formOpen && items.length > 0 ? [] : await getFullMenu();

  const soldOutIds = new Set(
    stock.filter((s) => s.current_stock <= 0).map((s) => s.menu_item_id)
  );
  const stockByItem = Object.fromEntries(
    stock.map((s) => [s.menu_item_id, s.current_stock])
  );

  const pastPickup = Boolean(weeklyMenu?.pickup_date && isPastDate(weeklyMenu.pickup_date));
  const dayDate = weeklyMenu?.pickup_date ? formatDayDate(weeklyMenu.pickup_date) : null;
  const nextCollectionDate = pastPickup ? formatDayDate(nextSaturday()) : null;
  const pickupTimeRange =
    weeklyMenu?.pickup_start_time && weeklyMenu?.pickup_end_time
      ? `${formatTimeOnly(weeklyMenu.pickup_start_time)}AM–${formatTimeOnly(weeklyMenu.pickup_end_time)}AM`
      : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h1 className="text-4xl">Weekly menu</h1>

          {pastPickup ? (
            <div className="mt-4 rounded-lg bg-accent px-4 py-3">
              <p className="text-base font-semibold uppercase tracking-wide sm:text-lg">
                Next collection: {nextCollectionDate}
                {pickupTimeRange ? ` · ${pickupTimeRange}` : ""}
              </p>
              <p className="mt-1 text-base text-muted-foreground">
                PRE-ORDERING IS NOW CLOSED - ORDERS RE-OPEN THURSDAY AT 7 PM
              </p>
              <p className="mt-1 text-base text-muted-foreground">Contactless payment available</p>
            </div>
          ) : (
            dayDate && (
              <div className="mt-4 rounded-lg bg-accent px-4 py-3">
                <p className="text-base font-semibold uppercase tracking-wide sm:text-lg">
                  Collection: {dayDate}
                  {pickupTimeRange ? ` · ${pickupTimeRange}` : ""}
                </p>
                <p className="mt-1 text-base text-muted-foreground">Contactless payment available</p>
              </div>
            )
          )}

          {!weeklyMenu || items.length === 0 ? (
            <>
              <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
                <p className="text-lg">Orders open Thursday at 6pm. Next menu coming then!</p>
                <div className="mt-6">
                  <ButtonLink href="/">Back Home</ButtonLink>
                </div>
              </div>
              <FullMenu items={fullMenu} />
            </>
          ) : !formOpen ? (
            <>
              <div className="mt-6 rounded-2xl border-2 border-primary bg-primary/10 px-6 py-5 text-center shadow-sm">
                <p className="text-base font-semibold text-primary sm:text-lg">
                  PRE-ORDERING IS NOW CLOSED - ORDERS RE-OPEN THURSDAY AT 7 PM
                </p>
              </div>
              {!pastPickup && weeklyMenu.announcement_message && (
                <p className="mt-4 rounded-lg bg-accent px-4 py-3 text-base font-medium">
                  {weeklyMenu.announcement_message}
                </p>
              )}
              <FullMenu items={fullMenu} />
            </>
          ) : (
            <OrderPageClient
              weeklyMenuId={weeklyMenu.id}
              announcement={weeklyMenu.announcement_message}
              items={items}
              soldOutIds={Array.from(soldOutIds)}
              stockByItem={stockByItem}
              pickupDate={weeklyMenu.pickup_date}
              pickupStartTime={weeklyMenu.pickup_start_time}
              pickupEndTime={weeklyMenu.pickup_end_time}
              pastPickup={pastPickup}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function FullMenu({ items }: { items: MenuItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="text-3xl">Our full menu</h2>
      <p className="mt-2 text-base text-muted-foreground">
        Each week we bake a selection from these favourites. Here&apos;s everything we make.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} readOnly />
        ))}
      </div>
    </section>
  );
}
