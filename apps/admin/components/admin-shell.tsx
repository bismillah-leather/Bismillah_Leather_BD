"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/orders" },
      { label: "Customers", href: "/customers" },
      { label: "Coupons", href: "/coupons" },
      { label: "Flash Sale", href: "/flash-sale" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products" },
      { label: "Inventory", href: "/inventory" },
      { label: "Product videos", href: "/product-videos" },
    ],
  },
  {
    label: "Store",
    items: [
      { label: "Content", href: "/content" },
      { label: "Team", href: "/team" },
      { label: "Settings", href: "/settings" },
      { label: "Account", href: "/account" },
    ],
  },
] as const;

function navActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  children,
  userName,
  userRole,
}: {
  children: ReactNode;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname() || "";

  return (
    <div className="admin-shell min-h-dvh md:grid md:grid-cols-[15.5rem_1fr]">
      <aside className="flex flex-col border-b border-border bg-[#12100e] md:sticky md:top-0 md:h-dvh md:border-r md:border-b-0">
        <div className="border-b border-border px-5 py-5">
          <p className="font-display text-2xl tracking-tight">Bismillah</p>
          <p className="mt-1 text-[10px] tracking-[0.24em] text-primary uppercase">Staff console</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-2.5 text-[10px] tracking-[0.18em] text-muted-foreground/70 uppercase">
                {group.label}
              </p>
              <ul className="mt-2 grid gap-0.5">
                {group.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex h-10 items-center rounded-md px-2.5 text-sm transition ${
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`mr-2.5 h-1 w-1 rounded-full ${
                            active ? "bg-primary" : "bg-transparent"
                          }`}
                          aria-hidden
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-border px-5 py-4">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="mt-0.5 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            {userRole}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <div className="relative min-w-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 8%, #c6a15b 0.5px, transparent 0.6px)",
            backgroundSize: "32px 32px",
          }}
        />
        <main className="relative mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
