import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminSearch } from "@/components/admin-search";
import { StatusSelect } from "@/components/status-select";
import { requireAdmin } from "@/lib/admin-auth";
import { ProductCreateForm } from "./product-create-form";
import { ProductDeleteButton } from "./product-delete-button";

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as (typeof STATUSES)[number])
    : undefined;

  const prisma = getPrisma();
  const [products, categories, counts] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        isFeatured: true,
        soldCount: true,
        updatedAt: true,
        primaryCategory: { select: { name: true } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { sku: true, price: true, stockOnHand: true },
        },
        _count: { select: { variants: true } },
      },
    }),
    prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, path: true },
    }),
    prisma.product.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const totalLive = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Add, publish, and remove leather products. Delete soft-archives so order history stays intact."
      />

      <ul className="mt-6 grid gap-3 sm:grid-cols-4">
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Live</p>
          <p className="font-display mt-1.5 text-2xl text-primary">{totalLive}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Published
          </p>
          <p className="font-display mt-1.5 text-2xl text-primary">
            {countMap.published ?? 0}
          </p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Draft</p>
          <p className="font-display mt-1.5 text-2xl">{countMap.draft ?? 0}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Categories
          </p>
          <p className="font-display mt-1.5 text-2xl">{categories.length}</p>
        </li>
      </ul>

      <ProductCreateForm categories={categories} />

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <Suspense fallback={null}>
          <AdminSearch placeholder="Search name or slug…" />
        </Suspense>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip href="/products" label="All" active={!status} />
          {STATUSES.map((s) => (
            <FilterChip
              key={s}
              href={`/products?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              label={s}
              active={status === s}
            />
          ))}
        </div>
      </div>

      <ul className="admin-panel mt-6 divide-y divide-border">
        {products.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">
            No products yet. Tap <span className="text-foreground">Add product</span> above.
          </li>
        ) : (
          products.map((p) => {
            const variant = p.variants[0];
            return (
              <li
                key={p.id}
                className="grid gap-4 px-4 py-4 lg:grid-cols-[1.4fr_9rem_10rem_auto] lg:items-center"
              >
                <div>
                  <p className="text-sm font-medium">
                    <Link
                      href={`/products/${p.id}`}
                      className="transition hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    {p.isFeatured ? (
                      <span className="ml-2 text-[10px] tracking-wide text-primary uppercase">
                        Featured
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    /{p.slug} · {p.primaryCategory.name}
                    {variant
                      ? ` · ${variant.sku} · ${formatPaisa(variant.price)} · stock ${variant.stockOnHand}`
                      : ""}
                    · {p._count.variants} variant{p._count.variants === 1 ? "" : "s"} · sold{" "}
                    {p.soldCount}
                    {" · "}
                    <Link href={`/products/${p.id}`} className="text-primary hover:underline">
                      Details / video
                    </Link>
                  </p>
                </div>
                <StatusSelect
                  endpoint={`/admin/api/products/${p.id}/status`}
                  bodyKey="status"
                  value={p.status}
                  options={STATUSES}
                />
                <p className="text-xs text-muted-foreground lg:text-right">
                  Updated {p.updatedAt.toLocaleDateString()}
                </p>
                <ProductDeleteButton productId={p.id} productName={p.name} />
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center rounded-md px-3 text-xs tracking-wide uppercase transition ${
        active
          ? "bg-primary/15 text-primary"
          : "border border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
