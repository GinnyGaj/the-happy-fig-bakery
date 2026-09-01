import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ExternalLinkButtons } from "@/components/ExternalLinkButtons";
import { ButtonLink } from "@/components/ui/Button";
import { MenuCard } from "@/components/MenuCard";
import { getCurrentWeeklyMenu } from "@/lib/queries";
import { formatDayDate } from "@/lib/utils";
import { OrderPageClient } from "./order/OrderPageClient";

export default async function Home() {
  const { weeklyMenu, items, stock } = await getCurrentWeeklyMenu();

  const soldOutIds = new Set(
    stock.filter((s) => s.current_stock <= 0).map((s) => s.menu_item_id)
  );
  const stockByItem = Object.fromEntries(
    stock.map((s) => [s.menu_item_id, s.current_stock])
  );

  const formOpen = Boolean(weeklyMenu?.form_open);
  const dayDate = weeklyMenu?.pickup_date ? formatDayDate(weeklyMenu.pickup_date) : null;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h1 className="text-4xl">
            This week&apos;s menu{dayDate ? ` (${dayDate})` : ""}
          </h1>

          <ExternalLinkButtons />

          {!weeklyMenu || items.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-lg">Orders open Thursday at 6pm. Next menu coming then!</p>
              <div className="mt-6">
                <ButtonLink href="/">Back Home</ButtonLink>
              </div>
            </div>
          ) : !formOpen ? (
            <>
              <div className="mt-6 rounded-2xl border-2 border-primary bg-primary/10 px-6 py-5 text-center shadow-sm">
                <p className="text-lg font-semibold text-primary sm:text-xl">
                  Pre-orders open every Thursday. Next menu coming soon!
                </p>
              </div>
              {weeklyMenu.announcement_message && (
                <p className="mt-4 rounded-lg bg-accent px-4 py-3 text-sm">
                  {weeklyMenu.announcement_message}
                </p>
              )}
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-50 pointer-events-none">
                {items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    soldOut={soldOutIds.has(item.id)}
                    remainingStock={stockByItem[item.id] ?? null}
                    readOnly
                  />
                ))}
              </div>
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
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
