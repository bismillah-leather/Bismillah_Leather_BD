import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { loadDashboardStats } from "@/lib/dashboard-stats";
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

function taka(paisa: bigint) {
  return Number(paisa) / 100;
}

const SHORTCUTS = [
  { href: "/orders", label: "Orders" },
  { href: "/statements", label: "Statements" },
  { href: "/products", label: "Products" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/flash-sale", label: "Flash sale" },
  { href: "/coupons", label: "Coupons" },
  { href: "/content", label: "Content" },
  { href: "/security", label: "Security" },
] as const;

export default async function AdminHomePage() {
  const now = new Date();
  const today = startOfLocalDay(now);
  const weekAgo = daysAgo(6);
  const dayStarts = Array.from({ length: 7 }, (_, i) => daysAgo(6 - i));
  const [session, stats, alerts] = await Promise.all([
    requireAdmin(),
    loadDashboardStats(weekAgo),
    listSecurityAlerts(4),
  ]);
  const {
    weekOrders,
    pending,
    unpaid,
    unfulfilled,
    customersTotal,
    customersNewWeek,
    lowStock,
    outOfStock,
    lockedAdmins,
    activeCoupons,
    statusGroups,
    paymentGroups,
    productGroups,
    topProducts,
  } = stats;

  const todayOrders = weekOrders.filter((order) => order.placedAt >= today);
  const sumTotal = (rows: typeof weekOrders) => rows.reduce((sum, order) => sum + order.total, 0n);
  const revenueToday = sumTotal(todayOrders);
  const revenueWeek = sumTotal(weekOrders);
  const ordersToday = todayOrders.length;
  const ordersWeek = weekOrders.length;
  const aovToday = ordersToday > 0 ? revenueToday / BigInt(ordersToday) : 0n;
  const aovWeek = ordersWeek > 0 ? revenueWeek / BigInt(ordersWeek) : 0n;
  const showTodayAov = ordersToday > 0;
  const recentOrders = weekOrders.slice(0, 7);

  const series = dayStarts.map((start, i) => {
    const end = i === 6 ? new Date(now.getTime() + 1) : dayStarts[i + 1]!;
    const bucket = weekOrders.filter((order) => order.placedAt >= start && order.placedAt < end);
    return {
      label: shortDay(start),
      count: bucket.length,
      total: sumTotal(bucket),
    };
  });
  const published = productGroups.find((row) => row.status === "published")?._count._all ?? 0;
  const drafts = productGroups.find((row) => row.status === "draft")?._count._all ?? 0;
  const catalogTotal = productGroups.reduce((sum, row) => sum + row._count._all, 0);
  const paid = paymentGroups.find((row) => row.paymentStatus === "paid")?._count._all ?? 0;
  const orderTotal = statusGroups.reduce((sum, row) => sum + row._count._all, 0);
  const firstName = session.name.split(" ")[0] || session.name;
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const pulse = [
    { href: "/orders", label: "Pending", value: String(pending), hot: pending > 0 },
    { href: "/orders", label: "Unpaid", value: String(unpaid), hot: unpaid > 0 },
    { href: "/orders", label: "To pack", value: String(unfulfilled), hot: unfulfilled > 0 },
    { href: "/inventory", label: "Low stock", value: String(lowStock), hot: lowStock > 0 },
    { href: "/inventory", label: "Out of stock", value: String(outOfStock), hot: outOfStock > 0 },
    { href: "/security", label: "Locked staff", value: String(lockedAdmins), hot: lockedAdmins > 0 },
  ];

  return (
    <div className="grid gap-5">
      <section className="admin-hero">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
              Atelier overview
            </p>
            <h1 className="font-display mt-3 text-3xl tracking-tight text-[#f6efe4] sm:text-4xl">
              {greeting(now.getHours())}, {firstName}
            </h1>
            <p className="mt-2 text-sm text-[#cbbfae]">{dateLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className="admin-btn-ghost h-10 px-4 text-[11px]">
              Add product
            </Link>
            <Link href="/orders" className="admin-btn-primary h-10 px-4 text-[11px]">
              Orders
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:items-end">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-[#e4c98a]/80 uppercase">
              Revenue today
            </p>
            <p className="admin-figure mt-3 text-5xl text-[#f4e2bc] sm:text-6xl">
              {formatPaisa(revenueToday)}
            </p>
            <p className="mt-3 text-sm text-[#cbbfae]">
              {formatPaisa(revenueWeek)} across the last 7 days
              {ordersWeek > 0 ? ` · ${ordersWeek} orders` : ""}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
              <Stat label="Orders today" value={String(ordersToday)} hint={`${ordersWeek} this week`} />
              <Stat
                label="Average order"
                value={formatPaisa(showTodayAov ? aovToday : aovWeek)}
                hint={showTodayAov ? "Today" : "7-day average"}
              />
              <Stat
                label="Customers"
                value={String(customersTotal)}
                hint={`+${customersNewWeek} this week`}
              />
              <Stat label="Live products" value={String(published)} hint={`${drafts} drafts`} />
            </dl>
          </div>
          <RevenueChart series={series} weekTotal={revenueWeek} />
        </div>
      </section>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {pulse.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={`admin-panel flex h-full flex-col justify-between px-3.5 py-3 transition hover:border-[#c6a15b]/45 ${
                item.hot ? "border-[#c6a15b]/40" : ""
              }`}
            >
              <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                {item.label}
              </span>
              <span className="admin-figure mt-3 text-2xl text-[#f6efe4]">{item.value}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.75fr)]">
        <section className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <h2 className="font-display text-xl tracking-tight">Recent orders</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{orderTotal} on the books</p>
            </div>
            <Link href="/orders" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-12 text-sm text-muted-foreground">
              No orders yet. The ledger fills in as soon as the first COD comes through.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-ledger w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 font-medium">Fulfillment</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-white/6 last:border-0">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-black">{order.number}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {order.customerPhone} ·{" "}
                          {order.placedAt.toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="px-3 py-3.5">
                        <Pill>{order.status}</Pill>
                      </td>
                      <td className="px-3 py-3.5">
                        <Pill tone={order.paymentStatus === "paid" ? "gold" : "quiet"}>
                          {order.paymentStatus.replaceAll("_", " ")}
                        </Pill>
                      </td>
                      <td className="px-3 py-3.5 capitalize text-muted-foreground">
                        {order.fulfillmentStatus.replaceAll("_", " ")}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-black">
                        {formatPaisa(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="grid gap-5">
          <section className="admin-panel p-5">
            <h2 className="font-display text-xl tracking-tight">Catalog</h2>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              <Mini label="Live" value={String(published)} />
              <Mini label="Drafts" value={String(drafts)} />
              <Mini label="All" value={String(catalogTotal)} />
            </dl>
            <div className="mt-5 grid gap-3">
              <Meter
                label="Paid orders"
                value={paid}
                total={Math.max(orderTotal, 1)}
                hint={orderTotal === 0 ? "No orders yet" : `${paid} of ${orderTotal}`}
              />
              <Meter
                label="Stock at risk"
                value={lowStock + outOfStock}
                total={Math.max(lowStock + outOfStock + published, 1)}
                hint={`${lowStock} low · ${outOfStock} out`}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {activeCoupons} active coupon{activeCoupons === 1 ? "" : "s"}
            </p>
          </section>

          <section className="admin-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl tracking-tight">Best sellers</h2>
              <Link href="/products" className="text-xs font-medium text-primary hover:underline">
                Catalog
              </Link>
            </div>
            {topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No published products yet.</p>
            ) : (
              <ol className="mt-4 grid gap-3">
                {topProducts.map((product, index) => (
                  <li key={product.id} className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm">
                      <span className="mr-2 text-xs text-[#e4c98a]">{index + 1}</span>
                      {product.name}
                    </p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {product.soldCount} sold
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="admin-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl tracking-tight">Security</h2>
              <Link href="/security" className="text-xs font-medium text-primary hover:underline">
                Open
              </Link>
            </div>
            {alerts.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No recent alerts. The floor is quiet.</p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {alerts.slice(0, 3).map((alert) => (
                  <li key={alert.id}>
                    <p className="line-clamp-2 text-sm leading-5">{alert.detail}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(alert.at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Dashboard shortcuts">
        {SHORTCUTS.map((item) => (
          <Link key={item.href} href={item.href} className="admin-btn-ghost h-9 px-3 text-[11px]">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-[#120f0c] px-3 py-3">
      <dt className="text-[10px] tracking-[0.14em] text-[#cbbfae] uppercase">{label}</dt>
      <dd className="admin-figure mt-2 text-lg text-[#f6efe4]">{value}</dd>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="admin-figure mt-1.5 text-2xl">{value}</dd>
    </div>
  );
}

function Pill({ children, tone = "quiet" }: { children: string; tone?: "gold" | "quiet" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] capitalize ${
        tone === "gold" ? "bg-[#c6a15b]/18 text-[#f4e2bc]" : "bg-white/6 text-[#d9d0c4]"
      }`}
    >
      {children}
    </span>
  );
}

function Meter({
  label,
  value,
  total,
  hint,
}: {
  label: string;
  value: number;
  total: number;
  hint: string;
}) {
  const width = Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{hint}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-black"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function RevenueChart({
  series,
  weekTotal,
}: {
  series: Array<{ label: string; count: number; total: bigint }>;
  weekTotal: bigint;
}) {
  const values = series.map((point) => taka(point.total));
  const max = Math.max(1, ...values);
  const width = 640;
  const height = 168;
  const points = values.map((value, index) => {
    const x = series.length === 1 ? width / 2 : (index / (series.length - 1)) * width;
    const y = height - 18 - (value / max) * (height - 36);
    return { x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const quiet = values.every((value) => value === 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-[#f6efe4]">7-day revenue</h2>
        <p className="text-xs text-[#cbbfae]">{formatPaisa(weekTotal)}</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-40 w-full" role="img" aria-label="Revenue for the last seven days">
        <defs>
          <linearGradient id="admin-gold-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e4c98a" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#e4c98a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((step) => (
          <line
            key={step}
            x1="0"
            x2={width}
            y1={height * step}
            y2={height * step}
            stroke="rgba(255,255,255,0.16)"
          />
        ))}
        <path d={area} fill="rgba(255,255,255,0.16)" />
        <path d={line} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((point) => (
          <circle key={point.x} cx={point.x} cy={point.y} r="3.5" fill="#ffffff" />
        ))}
      </svg>
      <ul className="mt-1 grid grid-cols-7 gap-1">
        {series.map((point) => (
          <li key={point.label} className="text-center">
            <p className="text-[10px] text-muted-foreground">{point.label}</p>
            <p className="text-[10px] tabular-nums text-[#cbbfae]">{point.count}</p>
          </li>
        ))}
      </ul>
      {quiet ? (
        <p className="mt-2 text-[11px] text-muted-foreground">No sales recorded in this window.</p>
      ) : null}
    </div>
  );
}
