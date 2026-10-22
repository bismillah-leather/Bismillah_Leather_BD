import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

const NAV = [
  { label: "Dashboard", href: "/" },
  { label: "Flash Sale", href: "/flash-sale" },
  { label: "Product videos", href: "/product-videos" },
  { label: "Security", href: "/security" },
  { label: "Products", href: null },
  { label: "Orders", href: null },
  { label: "Inventory", href: null },
  { label: "Customers", href: null },
  { label: "Coupons", href: null },
  { label: "Content", href: null },
  { label: "Settings", href: null },
] as const;

export function AdminShell({
  children,
  userName,
  userRole,
}: {
  children: ReactNode;
  userName: string;
  userRole: string;
}) {
  return (
    <div className="mx-auto grid min-h-full max-w-6xl md:grid-cols-[220px_1fr]">
      <aside className="border-b border-border px-4 py-5 md:border-r md:border-b-0">
        <p className="font-display text-xl">Bismillah</p>
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Admin</p>
        <nav className="mt-6 flex gap-2 overflow-x-auto md:grid">
          {NAV.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-sm text-foreground md:px-2 hover:bg-secondary"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-sm text-muted-foreground md:px-2"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="mt-8 border-t border-border pt-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          <LogoutButton />
        </div>
      </aside>
      <div className="px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
