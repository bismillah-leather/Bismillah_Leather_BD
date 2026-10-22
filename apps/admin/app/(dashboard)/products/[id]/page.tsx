import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-page-header";
import { StatusSelect } from "@/components/status-select";
import { requireAdmin } from "@/lib/admin-auth";
import { ProductDeleteButton } from "../product-delete-button";
import { ProductVideoEditor } from "./product-video-editor";

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const prisma = getPrisma();

  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      isFeatured: true,
      soldCount: true,
      updatedAt: true,
      publishedAt: true,
      primaryCategory: { select: { name: true, slug: true } },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: {
          id: true,
          sku: true,
          price: true,
          salePrice: true,
          stockOnHand: true,
          stockReserved: true,
        },
      },
      media: {
        where: { type: "video" },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { storageKey: true },
      },
      _count: { select: { variants: true, media: true } },
    },
  });

  if (!product) notFound();

  const variant = product.variants[0];
  const videoUrl = product.media[0]?.storageKey ?? null;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/products"
          className="text-xs tracking-wide text-muted-foreground uppercase transition hover:text-primary"
        >
          ← Products
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Catalog"
        title={product.name}
        description={`/${product.slug} · ${product.primaryCategory.name}. Add or remove the product film below.`}
      />

      <ul className="mt-6 grid gap-3 sm:grid-cols-4">
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Status</p>
          <div className="mt-2">
            <StatusSelect
              endpoint={`/admin/api/products/${product.id}/status`}
              bodyKey="status"
              value={product.status}
              options={STATUSES}
            />
          </div>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Price</p>
          <p className="font-display mt-1.5 text-2xl text-primary">
            {variant ? formatPaisa(variant.salePrice ?? variant.price) : "—"}
          </p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Stock</p>
          <p className="font-display mt-1.5 text-2xl">
            {variant ? variant.stockOnHand - variant.stockReserved : 0}
          </p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Sold</p>
          <p className="font-display mt-1.5 text-2xl">{product.soldCount}</p>
        </li>
      </ul>

      <section className="admin-panel mt-8 grid gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Details</p>
            <h2 className="font-display mt-1 text-2xl tracking-tight">Product info</h2>
          </div>
          <ProductDeleteButton
            productId={product.id}
            productName={product.name}
            redirectTo="/products"
          />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">SKU</dt>
            <dd className="mt-1">{variant?.sku ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Category
            </dt>
            <dd className="mt-1">{product.primaryCategory.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Variants
            </dt>
            <dd className="mt-1">{product._count.variants}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Featured
            </dt>
            <dd className="mt-1">{product.isFeatured ? "Yes" : "No"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Description
            </dt>
            <dd className="mt-1 text-muted-foreground">
              {product.description?.trim() || "No description yet."}
            </dd>
          </div>
        </dl>
        {variant ? (
          <p className="text-xs text-muted-foreground">
            <Link href="/inventory" className="text-primary hover:underline">
              Adjust stock in Inventory
            </Link>
          </p>
        ) : null}
      </section>

      <ProductVideoEditor
        productId={product.id}
        productName={product.name}
        initialUrl={videoUrl}
      />
    </div>
  );
}
