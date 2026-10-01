"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/menu", label: "Menu Management" },
  { href: "/admin/orders", label: "Order Management" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/inventory", label: "Inventory & Expenses" },
  { href: "/admin/recipes", label: "Recipes" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <aside className="hidden border-border bg-card lg:block lg:w-56 lg:border-r">
        <div className="px-5 py-5">
          <Link href="/admin" className="font-display text-lg">
            The Happy Fig
          </Link>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Admin</p>
        </div>
        <nav className="flex flex-col gap-1 px-3 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-primary ${
                isActive(item.href) ? "bg-muted text-primary" : "text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-5 py-3 lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
            >
              <span className="sr-only">Toggle navigation</span>
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M1 3H17M1 9H17M1 15H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <div>
              <Link href="/admin" className="font-display text-base leading-tight">
                The Happy Fig
              </Link>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Admin</p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Log out
            </button>
          </form>
        </header>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-b border-border bg-card px-3 py-3 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-primary ${
                  isActive(item.href) ? "bg-muted text-primary" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <main className="flex-1 bg-background px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
