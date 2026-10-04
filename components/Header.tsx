import Link from "next/link";
import { ExternalLinkButtons } from "@/components/ExternalLinkButtons";
import { LogoV1 } from "@/components/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center">
          <LogoV1 />
        </Link>
        <ExternalLinkButtons />
      </div>
    </header>
  );
}
