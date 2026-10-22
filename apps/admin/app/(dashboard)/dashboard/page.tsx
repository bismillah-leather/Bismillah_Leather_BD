import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { listSecurityAlerts } from "@/lib/security-alerts";

function startOfLocalDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = startOfLocalDay();
  d.setDate(d.getDate() - n);
  return d;
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function shortDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default async function AdminHomePage() {
  const session = await requireAdmin();
  const prisma = getPrisma();
  const now = new Date();
  const today = startOfLocalDay(now);
  const weekAgo = daysAgo(6);
  const monthAgo = daysAgo(29);

  const dayStarts = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));

  const [
    todayAgg,
    weekAgg,
    monthAgg,
    ordersToday,
    ordersWeek,
    ordersMonth,
    pending,
    confirmed,
    completed,
    cancelled,
    unpaid,
    paid,
    unfulfilled,
    shipped,
    delivered,
    customersTotal,
    customersNewWeek,
    customersBlocked,
    productsActive,
    variantsActive,
    lowStock,
    outOfStock,
    staffActive,
    lockedAdmins,
    recentOrders,
    alerts,
    dayCounts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { placedAt: { gte: today } },
      _sum: { total: true },
      _avg: { total: true },
    }),
    prisma.order.aggregate({
      where: { placedAt: { gte: weekAgo } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { placedAt: { gte: monthAgo } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { placedAt: { gte: today } } }),
    prisma.order.count({ where: { placedAt: { gte: weekAgo } } }),
    prisma.order.count({ where: { placedAt: { gte: monthAgo } } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "confirmed" } }),
    prisma.order.count({ where: { status: "completed" } }),
    prisma.order.count({ where: { status: "cancelled" } }),
    prisma.order.count({ where: { paymentStatus: "unpaid" } }),
    prisma.order.count({ where: { paymentStatus: "paid" } }),
    prisma.order.count({ where: { fulfillmentStatus: "unfulfilled" } }),
    prisma.order.count({ where: { fulfillmentStatus: "shipped" } }),
    prisma.order.count({ where: { fulfillmentStatus: "delivered" } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.customer.count({ where: { isBlocked: true } }),
    prisma.product.count({ where: { status: "published", deletedAt: null } }),
    prisma.productVariant.count({ where: { isActive: true } }),
    prisma.productVariant.count({
      where: { isActive: true, stockOnHand: { gt: 0, lte: 3 } },
    }),
    prisma.productVariant.count({
      where: { isActive: true, stockOnHand: { lte: 0 } },
    }),
    prisma.adminUser.count({ where: { isActive: true } }),
    prisma.adminUser.count({ where: { lockedUntil: { gt: now } } }),
    prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        customerPhone: true,
        placedAt: true,
      },
    }),
    listSecurityAlerts(4),
    Promise.all(
      dayStarts.map((start, i) => {
        const end = i === 6 ? new Date(now.getTime() + 1) : dayStarts[i + 1]!;
        return prisma.order.count({
          where: { placedAt: { gte: start, lt: end } },
        });
      }),
    ),
  ]);

  const revenueToday = todayAgg._sum.total ?? 0n;
  const revenueWeek = weekAgg._sum.total ?? 0n;
  const revenueMonth = monthAgg._sum.total ?? 0n;
  const aovToday = todayAgg._avg.total != null ? BigInt(Math.round(Number(todayAgg._avg.total))) : 0n;
  const maxDay = Math.max(1, ...dayCounts);

  const heroKpis = [
    { label: "Revenue today", value: formatPaisa(revenueToday), hint: "Gross order total" },
    { label: "Orders today", value: String(ordersToday), hint: "Since midnight" },
    { label: "Avg order", value: formatPaisa(aovToday), hint: "Today’s AOV" },
    { label: "Customers", value: String(customersTotal), hint: `+${customersNewWeek} this week` },
  ];

  const orderPipeline = [
    { label: "Pending", value: pending, tone: "warn" as const },
    { label: "Confirmed", value: confirmed, tone: "ok" as const },
    { label: "Completed", value: completed, tone: "ok" as const },
    { label: "Cancelled", value: cancelled, tone: "bad" as const },
  ];

  const moneyOps = [
    { label: "Unpaid", value: unpaid },
    { label: "Paid", value: paid },
    { label: "Unfulfilled", value: unfulfilled },
    { label: "Shipped", value: shipped },
    { label: "Delivered", value: delivered },
    { label: "Week orders", value: ordersWeek },
  ];

  const catalog = [
    { label: "Published products", value: productsActive },
    { label: "Live variants", value: variantsActive },
    { label: "Low stock", value: lowStock },
    { label: "Out of stock", value: outOfStock },
    { label: "Staff online", value: staffActive },
    { label: "Locked admins", value: lockedAdmins },
  ];

  const shortcuts = [
    { href: "/orders", title: "Orders", body: "Confirm & fulfill" },
    { href: "/products", title: "Products", body: "Publish catalog" },
    { href: "/inventory", title: "Inventory", body: "Adjust stock" },
    { href: "/customers", title: "Customers", body: "Buyers & blocks" },
    { href: "/coupons", title: "Coupons", body: "Promo codes" },
    { href: "/content", title: "Content", body: "Pages & home" },
    { href: "/flash-sale", title: "Flash sale", body: "Countdown deals" },
    { href: "/settings", title: "Settings", body: "Store contacts" },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={`${greeting(now.getHours())}, ${session.name}. Live pulse from Mirpur-10.`}
      />

      <section className="admin-hero mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.22em] text-primary uppercase">Today</p>
            <p className="font-display mt-1 text-2xl tracking-tight sm:text-3xl">
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Week revenue {formatPaisa(revenueWeek)} · 30-day {formatPaisa(revenueMonth)} ·{" "}
              {ordersMonth} orders this month
            </p>
          </div>
          <div className="rounded-md border border-primary/25 bg-primary/10 px-3.5 py-2 text-right">
            <p className="text-[10px] tracking-[0.16em] text-primary uppercase">Role</p>
            <p className="mt-0.5 text-sm font-medium capitalize">{session.role}</p>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {heroKpis.map((kpi) => (
            <li
              key={kpi.label}
              className="border border-white/8 bg-black/25 px-4 py-3.5 backdrop-blur-[1px]"
            >
              <p className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                {kpi.label}
              </p>
              <p className="font-display mt-1.5 text-2xl tracking-tight text-primary sm:text-[1.65rem]">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section className="admin-panel p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Orders · last 7 days
            </h2>
            <p className="text-xs text-muted-foreground">{ordersWeek} total</p>
          </div>
          <div className="admin-bar mt-5">
            {dayCounts.map((count, i) => {
              const barPx =
                count === 0 ? 10 : Math.max(24, Math.round((count / maxDay) * 110));
              return (
                <div
                  key={dayStarts[i]!.toISOString()}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                  title={`${shortDay(dayStarts[i]!)}: ${count}`}
                >
                  <span className="text-[10px] tabular-nums text-muted-foreground">{count}</span>
                  <span
                    className={`admin-bar-fill ${count === 0 ? "opacity-40" : ""}`}
                    style={{ height: `${barPx}px` }}
                  />
                </div>
              );
            })}
          </div>
          <ul className="mt-3 grid grid-cols-7 gap-1">
            {dayStarts.map((d) => (
              <li
                key={d.toISOString()}
                className="text-center text-[10px] tracking-wide text-muted-foreground uppercase"
              >
                {shortDay(d)}
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-panel p-5 sm:p-6">
          <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Order pipeline
          </h2>
          <ul className="mt-4 grid gap-2.5">
            {orderPipeline.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between border border-border/80 bg-background/40 px-3.5 py-2.5"
              >
                <span className="text-sm text-foreground/90">{row.label}</span>
                <span
                  className={`font-display text-xl tracking-tight ${
                    row.tone === "warn"
                      ? "text-amber-400"
                      : row.tone === "bad"
                        ? "text-destructive"
                        : "text-primary"
                  }`}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Fulfillment & payments
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {moneyOps.map((item) => (
            <li key={item.label} className="admin-metric">
              <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {item.label}
              </p>
              <p className="font-display mt-2 text-2xl tracking-tight">{item.value}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Catalog & team
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {catalog.map((item) => (
            <li key={item.label} className="admin-metric">
              <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {item.label}
              </p>
              <p
                className={`font-display mt-2 text-2xl tracking-tight ${
                  item.label.includes("stock") && item.value > 0
                    ? "text-amber-400"
                    : item.label.includes("Locked") && item.value > 0
                      ? "text-destructive"
                      : "text-primary"
                }`}
              >
                {item.value}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Recent orders
            </h2>
            <span className="text-xs text-muted-foreground">Latest 6</span>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-medium">{o.number}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.customerPhone} · {o.status} · {o.paymentStatus} · {o.fulfillmentStatus}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary">{formatPaisa(o.total)}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {o.placedAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Security pulse
            </h2>
            <Link href="/security" className="text-xs text-primary underline-offset-2 hover:underline">
              Open →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
            <div className="bg-card px-5 py-4">
              <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                Locked
              </p>
              <p
                className={`font-display mt-1 text-2xl ${
                  lockedAdmins > 0 ? "text-destructive" : "text-primary"
                }`}
              >
                {lockedAdmins}
              </p>
            </div>
            <div className="bg-card px-5 py-4">
              <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                Blocked buyers
              </p>
              <p className="font-display mt-1 text-2xl text-primary">{customersBlocked}</p>
            </div>
          </div>
          {alerts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No recent alerts.</p>
          ) : (
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <p className="line-clamp-2 text-sm">{a.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {a.kind} · {new Date(a.at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          Jump in
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="admin-panel block px-4 py-4 transition hover:border-primary/40"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
