import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LeafDivider } from "@/components/LeafDivider";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const steps = [
  { number: "1", title: "Browse", copy: "See this week's menu Thursday." },
  { number: "2", title: "Choose", copy: "Pick your bakes and quantity." },
  { number: "3", title: "Order", copy: "Tell us your name and WhatsApp." },
  { number: "4", title: "Collect", copy: "Pick up Saturday morning." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h1 className="text-4xl leading-[1.1] sm:text-5xl">
            Homemade goodness from our kitchen to your table
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            We bake in small batches on a Friday, using fruit from our own fig tree
            when it&apos;s in season. Order Thursday, collect fresh from our door on
            Saturday morning.
          </p>
          <div className="mt-8">
            <ButtonLink href="/order">Order This Week</ButtonLink>
          </div>
        </section>

        <LeafDivider />

        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-center text-3xl">How it works</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="paper flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6"
              >
                <Badge>{step.number}</Badge>
                <h3 className="text-xl">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <LeafDivider />

        <section id="about" className="mx-auto max-w-3xl px-5 py-14 text-center">
          <h2 className="text-3xl">About us</h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            The Happy Fig started as a way to share what we bake for our own
            family on Saturdays. Everything is made by hand in our N22 kitchen,
            in small batches, with care taken over every fold and proof. We
            believe good bread and pastry should bring people together — that&apos;s
            why we sell through our WhatsApp community, one weekend at a time.
          </p>
          <p className="handwritten mt-6 text-lg">from our kitchen to your table</p>
        </section>

        <LeafDivider />

        <section className="mx-auto max-w-2xl px-5 py-16 text-center">
          <h2 className="text-3xl">See this week&apos;s menu</h2>
          <p className="mt-3 text-base text-muted-foreground">
            Orders open Thursday. Pickup Saturday morning.
          </p>
          <div className="mt-7">
            <ButtonLink href="/order">Order Now</ButtonLink>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
