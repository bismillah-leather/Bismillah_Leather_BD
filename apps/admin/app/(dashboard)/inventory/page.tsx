import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminSearch } from "@/components/admin-search";
import { StockEditor } from "@/components/stock-editor";
import { requireAdmin } from "@/lib/admin-auth";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const filter = sp.filter === "low" || sp.filter === "out" ? sp.filter : "all";

  const prisma = getPrisma();
  const variants = await prisma.productVariant.findMany({
    where: {
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
    },
    orderBy: [{ stockOnHand: "asc" }, { sku: "asc" }],
    take: 100,
    select: {
      id: true,
      sku: true,
      price: true,
      stockOnHand: true,
      stockReserved: true,
      product: { select: { name: true, slug: true } },
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Warehouse"
        title="Inventory"
        description="Adjust on-hand stock. Reserved units stay locked for open carts/orders."
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Suspense fallback={null}>
          <AdminSearch placeholder="Search SKU or product…" />
        </Suspense>
        <div className="flex gap-1.5">
          {(
            [
              ["all", "All"],
              ["low", "Low"],
              ["out", "Out"],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={key === "all" ? "/inventory" : `/inventory?filter=${key}`}
              className={`inline-flex h-9 items-center rounded-md px-3 text-xs tracking-wide uppercase ${
                filter === key
                  ? "bg-primary/15 text-primary"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {variants.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">No variants found.</li>
        ) : (
          variants.map((v) => (
            <li
              key={v.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium">{v.product.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {v.sku} · {formatPaisa(v.price)} · reserved {v.stockReserved}
                  {v.stockOnHand <= 0
                    ? " · out"
                    : v.stockOnHand <= 3
                      ? " · low"
                      : ""}
                </p>
              </div>
              <StockEditor variantId={v.id} stockOnHand={v.stockOnHand} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
