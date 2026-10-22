import { getPrisma } from "@bismillah/db";
import { BRAND, formatPaisa } from "@bismillah/shared";
import {
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { requireCustomer } from "@/lib/customer-auth";
import { AccountLogoutButton } from "./logout-button";

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("deliver") || s.includes("complete")) {
    return "border-emerald-600/30 bg-emerald-50 text-emerald-800";
  }
  if (s.includes("cancel") || s.includes("fail")) {
    return "border-red-600/25 bg-red-50 text-red-800";
  }
  if (s.includes("pending") || s.includes("confirm")) {
    return "border-amber-600/30 bg-amber-50 text-amber-900";
  }
  return "border-border bg-secondary text-foreground";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BL";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

async function AccountDashboard() {
  const session = await requireCustomer();
  const prisma = getPrisma();

  const [customer, orders] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: session.sub },
      select: {
        name: true,
        phone: true,
        email: true,
        orderCount: true,
        totalSpent: true,
        addresses: {
          where: { isDefault: true },
          take: 1,
          select: {
            district: true,
            division: true,
            addressLine: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { customerId: session.sub },
      orderBy: { placedAt: "desc" },
      take: 20,
      select: {
        id: true,
        number: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        placedAt: true,
        items: {
          take: 1,
          select: { name: true, imageKey: true, qty: true },
        },
      },
    }),
  ]);

  const name = customer?.name ?? session.name;
  const phone = customer?.phone ?? session.phone;
  const email = customer?.email;
  const address = customer?.addresses[0];
  const orderCount = customer?.orderCount ?? orders.length;
  const totalSpent = customer?.totalSpent ?? 0n;
  const pending = orders.filter((o) => o.status.toLowerCase().includes("pending")).length;

  const whatsappHref = `${BRAND.whatsappUrl}?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমার অ্যাকাউন্ট (${phone}) নিয়ে সাহায্য চাই।`,
  )}`;

  return (
    <div className="relative overflow-hidden bg-secondary/25">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #000 0.55px, transparent 0.65px), radial-gradient(circle at 80% 70%, #000 0.45px, transparent 0.55px)",
          backgroundSize: "26px 26px, 38px 38px",
        }}
      />

      {/* Profile hero */}
      <section className="relative border-b border-border bg-neutral-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url(/catalog/hero-leather.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55" />
        <div className="auth-grain absolute inset-0 opacity-[0.12] mix-blend-overlay" />

        <div className="relative mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-medium tracking-wide backdrop-blur-sm sm:size-[4.5rem] sm:text-xl">
              {initials(name)}
            </div>
            <div>
              <p className="text-[11px] tracking-[0.24em] text-white/55 uppercase">My account</p>
              <h1 className="font-display mt-1.5 text-3xl tracking-tight sm:text-5xl">
                Hello, {name.split(" ")[0]}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" strokeWidth={1.75} />
                  {phone}
                </span>
                {email ? <span className="truncate">{email}</span> : null}
              </div>
              {address ? (
                <p className="mt-2 inline-flex max-w-md items-start gap-1.5 text-xs leading-5 text-white/55">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.75} />
                  {address.addressLine}, {address.district}, {address.division}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/#all-products"
              className="inline-flex h-11 items-center gap-2 bg-white px-4 text-sm font-medium text-black transition hover:bg-white/90"
            >
              <ShoppingBag className="size-4" strokeWidth={1.75} />
              Shop
            </Link>
            <AccountLogoutButton tone="dark" />
          </div>
        </div>
      </section>

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Stats */}
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Orders",
              value: String(orderCount),
              hint: pending > 0 ? `${pending} pending` : "All time",
            },
            {
              label: "Spent",
              value: formatPaisa(totalSpent),
              hint: "Across confirmed orders",
            },
            {
              label: "Member",
              value: BRAND.shortName,
              hint: "COD · Mirpur-10 pack",
            },
          ].map((stat) => (
            <li
              key={stat.label}
              className="border border-border bg-white px-5 py-5 transition hover:border-foreground"
            >
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                {stat.label}
              </p>
              <p className="font-display mt-2 text-2xl tracking-tight sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
            </li>
          ))}
        </ul>

        {/* Quick actions */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            href="/#all-products"
            className="group flex items-center gap-3 border border-border bg-white px-4 py-4 transition hover:border-foreground"
          >
            <span className="inline-flex size-10 items-center justify-center border border-border bg-secondary transition group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
              <Package className="size-4" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-medium">Browse leather</span>
              <span className="text-xs text-muted-foreground">Wallets & belts</span>
            </span>
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 border border-border bg-white px-4 py-4 transition hover:border-foreground"
          >
            <span className="inline-flex size-10 items-center justify-center border border-border bg-secondary text-[#128C7E] transition group-hover:border-[#128C7E] group-hover:bg-[#128C7E] group-hover:text-white">
              <Sparkles className="size-4" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-medium">WhatsApp us</span>
              <span className="text-xs text-muted-foreground">Order help · status</span>
            </span>
          </a>
          <a
            href={`tel:${BRAND.phoneE164}`}
            className="group flex items-center gap-3 border border-border bg-white px-4 py-4 transition hover:border-foreground"
          >
            <span className="inline-flex size-10 items-center justify-center border border-border bg-secondary transition group-hover:border-foreground group-hover:bg-foreground group-hover:text-background">
              <Phone className="size-4" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block text-sm font-medium">Call showroom</span>
              <span className="text-xs text-muted-foreground">{BRAND.phoneDisplay}</span>
            </span>
          </a>
        </div>

        {/* Orders */}
        <section className="mt-10 sm:mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                Order history
              </p>
              <h2 className="font-display mt-1 text-3xl tracking-tight">Your orders</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Packed from {BRAND.addressShort} after a confirmation call.
              </p>
            </div>
            <Link
              href="/checkout"
              className="text-sm underline underline-offset-4 transition hover:text-muted-foreground"
            >
              Go to checkout
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="border border-border bg-white px-6 py-16 text-center">
              <span className="mx-auto inline-flex size-14 items-center justify-center border border-border bg-secondary">
                <Package className="size-6 text-muted-foreground" strokeWidth={1.5} />
              </span>
              <p className="font-display mt-5 text-3xl tracking-tight">No orders yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Place an order with this mobile — it will show up here with status and total.
              </p>
              <Link
                href="/#all-products"
                className="mt-7 inline-flex h-12 items-center bg-foreground px-6 text-sm font-medium tracking-wide text-background uppercase"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="grid gap-3">
              {orders.map((o) => {
                const first = o.items[0];
                return (
                  <li
                    key={o.id}
                    className="grid gap-4 border border-border bg-white p-4 transition hover:border-foreground sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium tracking-tight">{o.number}</p>
                        <span
                          className={`inline-flex h-6 items-center border px-2 text-[10px] tracking-[0.12em] uppercase ${statusTone(o.status)}`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {o.placedAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {" · "}
                        {o.paymentStatus}
                        {" · "}
                        {o.fulfillmentStatus}
                      </p>
                      {first ? (
                        <p className="mt-2 truncate text-sm text-muted-foreground">
                          {first.name}
                          {first.qty > 1 ? ` × ${first.qty}` : ""}
                          {o.items.length > 1 ? " + more" : ""}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-base font-medium tabular-nums sm:text-right">
                      {formatPaisa(o.total)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Need a change on an order? Call {BRAND.phoneDisplay} or WhatsApp — we confirm before
          courier booking.
        </p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Loading your account…
        </div>
      }
    >
      <AccountDashboard />
    </Suspense>
  );
}
