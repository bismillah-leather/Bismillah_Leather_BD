import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Flash Sale", href: "/flash-sale" },
  { label: "Product videos", href: "/product-videos" },
  { label: "Team", href: "/team" },
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
    <div className="mx-auto grid min-h-dvh max-w-6xl md:grid-cols-[240px_1fr]">
      <aside className="border-b border-border bg-card/40 px-5 py-6 md:border-r md:border-b-0">
        <p className="font-display text-2xl tracking-tight">Bismillah</p>
        <p className="mt-1 text-[11px] tracking-[0.22em] text-primary uppercase">Staff console</p>
        <nav className="mt-8 flex gap-1 overflow-x-auto md:grid md:gap-0.5">
          {NAV.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex h-10 shrink-0 items-center rounded-md px-3 text-sm text-foreground/90 transition hover:bg-secondary hover:text-foreground md:px-2.5"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="inline-flex h-10 shrink-0 items-center rounded-md px-3 text-sm text-muted-foreground/55 md:px-2.5"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div className="mt-10 border-t border-border pt-5">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="mt-0.5 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {userRole}
          </p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="px-5 py-7 sm:px-8">{children}</div>
    </div>
  );
}
