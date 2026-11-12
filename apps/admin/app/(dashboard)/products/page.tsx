import { getPrisma } from "@bismillah/db";
import Link from "next/link";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminSearch } from "@/components/admin-search";
import { requireAdmin } from "@/lib/admin-auth";
import { adminMediaSrc, requestStoreOrigin } from "@/lib/media-url";
import { ProductCreateForm } from "./product-create-form";
import { ProductShelfCard, type ShelfProduct } from "./product-shelf";

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; badge?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const onlyNew = sp.badge === "new";
  const status = STATUSES.includes(sp.status as (typeof STATUSES)[number])
    ? (sp.status as (typeof STATUSES)[number])
    : undefined;

  const prisma = getPrisma();
  const [, origin, products, categories, counts] = await Promise.all([
    requireAdmin(),
    requestStoreOrigin(),
    prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(onlyNew ? { isNew: true } : {}),
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
        isNew: true,
        soldCount: true,
        updatedAt: true,
        primaryCategory: { select: { id: true, name: true, sortOrder: true } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { sku: true, price: true, salePrice: true, stockOnHand: true },
        },
        media: {
          where: { type: "image" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { storageKey: true },
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
        description="Tap New on a product to put the red badge on its card, the product page, and the suggestions. Save edit still updates the price, stock, and photo."
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
          <FilterChip href="/products" label="All" active={!status && !onlyNew} />
          <FilterChip
            href={`/products?badge=new${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            label="New"
            active={onlyNew}
          />
          {STATUSES.map((s) => (
            <FilterChip
              key={s}
              href={`/products?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}${onlyNew ? "&badge=new" : ""}`}
              label={s}
              active={status === s}
            />
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="admin-panel mt-6 px-4 py-10 text-sm text-muted-foreground">
          No products yet. Use Add product above.
        </p>
      ) : (
        <div className="mt-8 grid gap-8">
          {groupByCategory(products, origin).map((group) => (
            <section key={group.name}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl tracking-tight">{group.name}</h2>
                <p className="text-xs text-muted-foreground">{group.items.length} on the store</p>
              </div>
              <ul className="grid gap-3 lg:grid-cols-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <ProductShelfCard product={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByCategory(
  products: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    isFeatured: boolean;
    isNew: boolean;
    primaryCategory: { name: string; sortOrder: number };
    variants: Array<{ sku: string; price: bigint; salePrice: bigint | null; stockOnHand: number }>;
    media: Array<{ storageKey: string }>;
  }>,
  origin: string,
) {
  const groups = new Map<string, { name: string; sort: number; items: ShelfProduct[] }>();
  for (const product of products) {
    const key = product.primaryCategory.name;
    const variant = product.variants[0];
    const item: ShelfProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      categoryName: key,
      image: adminMediaSrc(product.media[0]?.storageKey, origin),
      sku: variant?.sku ?? null,
      priceTaka: variant ? String(Number(variant.price) / 100) : "",
      salePriceTaka: variant?.salePrice != null ? String(Number(variant.salePrice) / 100) : "",
      stock: variant?.stockOnHand ?? 0,
    };
    const existing = groups.get(key);
    if (existing) existing.items.push(item);
    else groups.set(key, { name: key, sort: product.primaryCategory.sortOrder, items: [item] });
  }
  return [...groups.values()].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
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
