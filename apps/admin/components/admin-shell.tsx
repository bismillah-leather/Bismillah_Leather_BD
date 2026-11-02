"use client";

import {
  Clapperboard,
  ExternalLink,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Ticket,
  UserCog,
  UserRound,
  Users,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";

const STORE_URL =
  process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") || "http://localhost:3000";

const NAV_GROUPS: {
  label: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Orders", href: "/orders", icon: ShoppingBag },
      { label: "Statements", href: "/statements", icon: Landmark },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Inventory", href: "/inventory", icon: Warehouse },
      { label: "Product videos", href: "/product-videos", icon: Clapperboard },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Flash Sale", href: "/flash-sale", icon: Zap },
      { label: "Coupons", href: "/coupons", icon: Ticket },
      { label: "Content", href: "/content", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Team", href: "/team", icon: UserCog },
      { label: "Security", href: "/security", icon: Shield },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Account", href: "/account", icon: UserRound },
    ],
  },
];

function navActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "BL";
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
  const section =
    NAV_GROUPS.flatMap((group) => group.items).find((item) => navActive(pathname, item.href))
      ?.label ?? "Admin";

  return (
    <div className="admin-shell min-h-dvh md:grid md:grid-cols-[16.75rem_minmax(0,1fr)]">
      <aside className="admin-sidebar flex w-full min-w-0 flex-col md:sticky md:top-0 md:h-dvh md:w-[16.75rem]">
        <div className="px-4 pt-5 pb-4">
          <Link href="/dashboard" className="admin-brand">
            <span className="admin-brand-mark">BL</span>
            <span className="min-w-0">
              <span className="font-display block truncate text-lg leading-none tracking-tight">
                Bismillah
              </span>
              <span className="mt-1 block text-[10px] tracking-[0.18em] text-primary uppercase">
                Admin
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4" aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-medium tracking-[0.16em] text-primary/80 uppercase">
                {group.label}
              </p>
              <ul className="grid gap-0.5">
                {group.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        data-active={active ? "true" : "false"}
                        className="admin-nav-link"
                      >
                        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/25 px-3 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="mt-0.5 text-[10px] tracking-[0.16em] text-primary uppercase">
                {userRole}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="admin-canvas flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-white/8 bg-[#0e0c0a]/80 px-5 backdrop-blur-xl sm:px-8">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.2em] text-primary uppercase">Console</p>
            <p className="truncate font-display text-xl leading-none tracking-tight">{section}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/12 px-3.5 text-xs font-medium text-foreground/80 transition hover:border-primary/40 hover:text-primary"
            >
              View store
              <ExternalLink className="size-3.5" strokeWidth={1.75} />
            </a>
            <Link
              href="/orders"
              className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-xs font-semibold tracking-wide text-primary-foreground transition hover:opacity-90"
            >
              Orders
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[90rem] flex-1 px-5 py-7 sm:px-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
