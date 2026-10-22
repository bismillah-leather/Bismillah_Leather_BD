import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
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
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Hello, {session.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.phone}</p>
        </div>
        <AccountLogoutButton />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Your orders
        </h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No orders yet.{" "}
            <Link href="/" className="underline underline-offset-2">
              Browse the shop
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                <div>
                  <p className="font-medium">{o.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.placedAt.toLocaleDateString()} · {o.status} · {o.paymentStatus}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatPaisa(o.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading account…</p>}>
        <AccountDashboard />
      </Suspense>
    </div>
  );
}
