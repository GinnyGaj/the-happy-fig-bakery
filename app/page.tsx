import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

          {!weeklyMenu || items.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-lg">Orders open Thursday at 6pm. Next menu coming then!</p>
              <div className="mt-6">
                <ButtonLink href="/">Back Home</ButtonLink>
              </div>
            </div>
          ) : !formOpen ? (
            <>
              <div className="mt-6 rounded-2xl border-2 border-primary bg-accent p-8 text-center">
                <p className="text-xl font-semibold">
                  Orders open Thursday at 6pm. Next menu coming then!
                </p>
              </div>
              {weeklyMenu.announcement_message && (
                <p className="mt-4 rounded-lg bg-accent px-4 py-3 text-sm">
                  {weeklyMenu.announcement_message}
                </p>
              )}
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-50 pointer-events-none">
                {items.map((item) => (
                  <MenuCard key={item.id} item={item} soldOut={soldOutIds.has(item.id)} readOnly />
                ))}
              </div>
            </>
          ) : (
            <OrderPageClient
              weeklyMenuId={weeklyMenu.id}
              announcement={weeklyMenu.announcement_message}
              items={items}
              soldOutIds={Array.from(soldOutIds)}
              pickupDate={weeklyMenu.pickup_date}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
