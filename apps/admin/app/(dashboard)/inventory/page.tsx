import { getPrisma, type Prisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSearch } from "@/components/admin-search";
import { StockEditor } from "@/components/stock-editor";
import { requireAdmin } from "@/lib/admin-auth";
import { adminMediaSrc, requestStoreOrigin } from "@/lib/media-url";

function stockState(onHand: number) {
  if (onHand <= 0) return "out" as const;
  if (onHand <= 3) return "low" as const;
  return "healthy" as const;
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const filter = sp.filter === "low" || sp.filter === "out" ? sp.filter : "all";
  const originPromise = requestStoreOrigin();
  const prisma = getPrisma();
  const listWhere: Prisma.ProductVariantWhereInput = {
    isActive: true,
    ...(filter === "low" ? { stockOnHand: { gt: 0, lte: 3 } } : {}),
    ...(filter === "out" ? { stockOnHand: { lte: 0 } } : {}),
    ...(q
      ? {
          OR: [
            { sku: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [, variants, levels, movements, origin] = await Promise.all([
    requireAdmin(),
    prisma.productVariant.findMany({
      where: listWhere,
      orderBy: [{ stockOnHand: "asc" }, { sku: "asc" }],
      take: 100,
      select: {
        id: true,
        sku: true,
        price: true,
        stockOnHand: true,
        stockReserved: true,
        product: {
          select: {
            id: true,
            name: true,
            media: {
              where: { type: "image" as const },
              orderBy: { sortOrder: "asc" as const },
              take: 1,
              select: { storageKey: true },
            },
          },
        },
      },
    }),
    prisma.$queryRaw<
      {
        sku_count: number;
        on_hand: number;
        reserved: number;
        free_units: number;
        stock_value: string;
        low_count: number;
        out_count: number;
      }[]
    >`
      SELECT
        count(*)::int AS sku_count,
        coalesce(sum(stock_on_hand), 0)::int AS on_hand,
        coalesce(sum(stock_reserved), 0)::int AS reserved,
        coalesce(sum(GREATEST(stock_on_hand - stock_reserved, 0)), 0)::int AS free_units,
        coalesce(sum(price * GREATEST(stock_on_hand, 0)), 0)::text AS stock_value,
        count(*) FILTER (WHERE stock_on_hand > 0 AND stock_on_hand <= 3)::int AS low_count,
        count(*) FILTER (WHERE stock_on_hand <= 0)::int AS out_count
      FROM product_variants
      WHERE is_active
    `,
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        delta: true,
        reason: true,
        createdAt: true,
        variant: { select: { sku: true, product: { select: { name: true } } } },
      },
    }),
    originPromise,
  ]);
  const totals = levels[0] ?? {
    sku_count: 0,
    on_hand: 0,
    reserved: 0,
    free_units: 0,
    stock_value: "0",
    low_count: 0,
    out_count: 0,
  };
  const unitsOnHand = Number(totals.on_hand);
  const unitsReserved = Number(totals.reserved);
  const unitsFree = Number(totals.free_units);
  const stockValue = BigInt(totals.stock_value);
  const lowCount = Number(totals.low_count);
  const outCount = Number(totals.out_count);
  const skuCount = Number(totals.sku_count);
  const healthyCount = Math.max(0, skuCount - lowCount - outCount);

  const filters = [
    ["all", "All", skuCount],
    ["low", "Low", lowCount],
    ["out", "Out", outCount],
  ] as const;

  return (
    <div className="grid gap-5">
      <section className="admin-hero">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
              Warehouse
            </p>
            <h1 className="font-display mt-2 text-3xl tracking-tight text-[#f6efe4] sm:text-4xl">
              Inventory
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#cbbfae]">
              On-hand units, what is already reserved, and what is still free to sell.
            </p>
          </div>
          <Link href="/products" className="admin-btn-ghost h-10 px-4 text-[11px]">
            Products
          </Link>
        </div>

        <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          <Figure label="SKUs" value={String(skuCount)} hint={`${healthyCount} healthy`} />
          <Figure label="On hand" value={String(unitsOnHand)} hint={`${unitsReserved} reserved`} />
          <Figure label="Free to sell" value={String(unitsFree)} hint={`${outCount} out · ${lowCount} low`} />
          <Figure label="Stock value" value={formatPaisa(stockValue)} hint="At selling price" />
        </dl>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={null}>
          <AdminSearch placeholder="Search name or SKU…" />
        </Suspense>
        <div className="flex flex-wrap gap-1.5">
          {filters.map(([key, label, count]) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (key !== "all") params.set("filter", key);
            const href = params.size ? `/inventory?${params.toString()}` : "/inventory";
            const active = filter === key;
            return (
              <Link
                key={key}
                href={href}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-[11px] tracking-wide uppercase ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-white/12 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                <span className={active ? "text-white/80" : "text-neutral-500"}>{count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_18rem]">
        <ul className="grid gap-2">
          {variants.length === 0 ? (
            <li className="admin-panel px-5 py-14 text-sm text-muted-foreground">
              Nothing in this view. Clear the search or switch the filter.
            </li>
          ) : (
            variants.map((variant) => {
              const state = stockState(variant.stockOnHand);
              const free = Math.max(0, variant.stockOnHand - variant.stockReserved);
              const image = adminMediaSrc(variant.product.media[0]?.storageKey, origin);
              return (
                <li key={variant.id} className="admin-panel px-3 py-3 sm:px-4">
                  <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                    <div className="size-16 overflow-hidden rounded-xl bg-[#1c1814] sm:size-[4.5rem]">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-[10px] text-muted-foreground">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/products/${variant.product.id}`}
                          className="truncate text-sm font-medium text-[#f6efe4] hover:text-primary"
                        >
                          {variant.product.name}
                        </Link>
                        <StatePill state={state} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {variant.sku} · {formatPaisa(variant.price)}
                      </p>
                      <p className="mt-2 text-xs tabular-nums text-[#cbbfae]">
                        <span className="text-[#f6efe4]">{variant.stockOnHand}</span> on hand
                        <span className="mx-1.5 text-white/20">/</span>
                        {variant.stockReserved} reserved
                        <span className="mx-1.5 text-white/20">/</span>
                        {free} free
                      </p>
                    </div>
                    <StockEditor
                      variantId={variant.id}
                      stockOnHand={variant.stockOnHand}
                      stockReserved={variant.stockReserved}
                    />
                  </div>
                </li>
              );
            })
          )}
        </ul>

        <aside className="admin-panel h-fit p-5">
          <h2 className="font-display text-xl tracking-tight">Latest moves</h2>
          {movements.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Adjustments show up here after the first stock save.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {movements.map((move) => (
                <li key={move.id} className="border-b border-white/8 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm">{move.variant.product.name}</p>
                    <p
                      className={`shrink-0 text-sm tabular-nums ${
                        move.delta >= 0 ? "text-[#e4c98a]" : "text-[#f0b2a6]"
                      }`}
                    >
                      {move.delta > 0 ? `+${move.delta}` : move.delta}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {move.variant.sku} · {move.reason} ·{" "}
                    {move.createdAt.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-[#120f0c] px-3.5 py-3.5">
      <dt className="text-[10px] tracking-[0.14em] text-[#cbbfae] uppercase">{label}</dt>
      <dd className="admin-figure mt-2 text-2xl text-[#f6efe4]">{value}</dd>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function StatePill({ state }: { state: "healthy" | "low" | "out" }) {
  const label = state === "out" ? "Out" : state === "low" ? "Low" : "In stock";
  const tone =
    state === "out"
      ? "bg-[#dc5a46]/15 text-[#f0b2a6]"
      : state === "low"
        ? "bg-[#c6a15b]/18 text-[#f4e2bc]"
        : "bg-white/6 text-[#d9d0c4]";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase ${tone}`}>{label}</span>;
}
