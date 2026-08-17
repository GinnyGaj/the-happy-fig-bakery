import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-display text-xl">The Happy Fig</span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            North London N22
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/#about"
            className="hidden text-sm text-foreground transition-colors hover:text-primary sm:inline"
          >
            About
          </Link>
          <Link
            href="/#faq"
            className="hidden text-sm text-foreground transition-colors hover:text-primary sm:inline"
          >
            FAQ
          </Link>
          <ButtonLink href="/order" className="h-10 px-5 text-sm">
            Order Now
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
