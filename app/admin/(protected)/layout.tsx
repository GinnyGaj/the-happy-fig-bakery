import Link from "next/link";
import { logout } from "@/lib/actions/auth";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/menu", label: "Menu Management" },
  { href: "/admin/orders", label: "Order Management" },
  { href: "/admin/form-settings", label: "Form Settings" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      <aside className="border-b border-border bg-card lg:w-56 lg:border-b-0 lg:border-r">
        <div className="px-5 py-5">
          <Link href="/admin" className="font-display text-lg">
            The Happy Fig
          </Link>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Admin</p>
        </div>
        <nav className="flex flex-row flex-wrap gap-1 px-3 pb-4 lg:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-border px-5 py-3">
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Log out
            </button>
          </form>
        </header>
        <main className="flex-1 bg-background px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
