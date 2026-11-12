"use client";

import {
  Clapperboard,
  ExternalLink,
  FileText,
  Landmark,
  LayoutDashboard,
  Menu,
  Package,
  PanelsTopLeft,
  Settings,
  Shield,
  ShoppingBag,
  Ticket,
  Truck,
  UserCog,
  UserRound,
  Users,
  Warehouse,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminPrefetch } from "./admin-prefetch";
import { LogoutButton } from "./logout-button";

const NAV_GROUPS: {
  label: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Orders", href: "/orders", icon: ShoppingBag },
      { label: "Couriers", href: "/couriers", icon: Truck },
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
      { label: "Landing pages", href: "/landings", icon: PanelsTopLeft },
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
  storeHref = "/",
}: {
  children: ReactNode;
  userName: string;
  userRole: string;
  storeHref?: string;
}) {
  const pathname = usePathname() || "";
  const section =
    NAV_GROUPS.flatMap((group) => group.items).find((item) => navActive(pathname, item.href))
      ?.label ?? "Admin";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="admin-shell min-h-dvh md:grid md:grid-cols-[17.5rem_minmax(0,1fr)]">
      <AdminPrefetch />
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(18.5rem,88vw)] -translate-x-full flex-col transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-dvh md:w-auto md:translate-x-0 ${menuOpen ? "translate-x-0" : ""}`}
      >
        <div className="flex items-start gap-2 px-4 pt-5 pb-4">
          <Link href="/dashboard" className="admin-brand min-w-0 flex-1">

            <span className="admin-brand-mark">BL</span>
            <span className="min-w-0">
              <span className="font-display block truncate text-lg leading-none tracking-tight">
                Bismillah
              </span>
              <span className="mt-1 block text-[10px] tracking-[0.18em] text-white/55 uppercase">
                Admin
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center border border-white/20 text-white md:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4" aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-3 pb-1.5 text-[10px] font-medium tracking-[0.16em] text-white/45 uppercase">
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
                        prefetch
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

        <div className="border-t border-white/15 p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/8 px-3 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="mt-0.5 text-[10px] tracking-[0.16em] text-white/55 uppercase">
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-black/10 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center border border-black md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.2em] text-primary uppercase">Console</p>
              <p className="truncate font-display text-xl leading-none tracking-tight">{section}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={storeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/15 px-3.5 text-xs font-medium text-black transition hover:border-black hover:bg-black hover:text-white"
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
