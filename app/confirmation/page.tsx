import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export default async function ConfirmationPage({
  searchParams,
}: PageProps<"/confirmation">) {
  const params = await searchParams;
  const name = typeof params.name === "string" ? params.name : "";
  const whatsapp = typeof params.whatsapp === "string" ? params.whatsapp : "";
  const subtotal = typeof params.subtotal === "string" ? params.subtotal : "0.00";
  const itemsRaw = typeof params.items === "string" ? params.items : "";

  const items = itemsRaw
    .split(",")
    .filter(Boolean)
    .map((entry) => {
      const [itemName, quantity, price] = entry.split("|");
      return { name: itemName, quantity: Number(quantity), price: Number(price) };
    });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <h1 className="text-4xl text-primary">Your order is booked ✓</h1>
          <p className="mt-3 text-lg">Thank you, {name || "friend"}</p>

          {items.length > 0 && (
            <div className="paper mt-8 rounded-2xl border border-border bg-card p-6 text-left">
              <h2 className="text-xl">Order summary</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-base font-medium">
                <span>Subtotal</span>
                <span>{formatPrice(Number(subtotal))}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Pickup Saturday 10am–12pm at 15 Oak Street. Ring bell on arrival.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-1 text-sm text-muted-foreground">
            {whatsapp && <p>We&apos;ve sent a summary to {whatsapp}</p>}
            <p>Collection instructions above</p>
            <p>See you Saturday!</p>
          </div>

          <p className="handwritten mt-6 text-lg">thank you for baking with us</p>

          <div className="mt-8">
            <ButtonLink href="/">Back Home</ButtonLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
