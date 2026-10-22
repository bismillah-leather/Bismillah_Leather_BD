import { getPrisma } from "@bismillah/db";
import { BRAND, formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { Suspense } from "react";
import { requireCustomer } from "@/lib/customer-auth";
import { AccountLogoutButton } from "./logout-button";

async function AccountDashboard() {
  const session = await requireCustomer();
  const prisma = getPrisma();

  const orders = await prisma.order.findMany({
    where: { customerId: session.sub },
    orderBy: { placedAt: "desc" },
    take: 20,
    select: {
      id: true,
      number: true,
      status: true,
      paymentStatus: true,
      total: true,
      placedAt: true,
    },
  });

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #000 0.55px, transparent 0.65px), radial-gradient(circle at 80% 70%, #000 0.45px, transparent 0.55px)",
          backgroundSize: "26px 26px, 38px 38px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              My account
            </p>
            <h1 className="font-display mt-2 text-4xl tracking-tight sm:text-5xl">
              Hello, {session.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{session.phone}</p>
          </div>
          <AccountLogoutButton />
        </div>

        <section className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Your orders
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Packed from {BRAND.addressShort} after confirmation.
              </p>
            </div>
            <Link href="/#all-products" className="text-sm underline underline-offset-4">
              Shop more
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 border border-border bg-white px-6 py-14 text-center">
              <p className="font-display text-2xl tracking-tight">No orders yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                When you place an order with this number, it shows up here.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex h-11 items-center bg-foreground px-5 text-sm font-medium text-background"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border border border-border bg-white">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{o.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.placedAt.toLocaleDateString()} · {o.status} · {o.paymentStatus}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums font-medium">{formatPaisa(o.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-muted-foreground">Loading account…</div>
      }
    >
      <AccountDashboard />
    </Suspense>
  );
}
