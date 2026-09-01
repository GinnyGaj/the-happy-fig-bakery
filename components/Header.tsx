import Link from "next/link";
import { ExternalLinkButtons } from "@/components/ExternalLinkButtons";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="font-display text-2xl">The Happy Fig</span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            HOME BAKERY
          </span>
        </Link>
        <ExternalLinkButtons />
      </div>
    </header>
  );
}
