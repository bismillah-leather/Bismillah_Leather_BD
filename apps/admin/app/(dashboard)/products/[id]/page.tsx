import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-page-header";
import { StatusSelect } from "@/components/status-select";
import { requireAdmin } from "@/lib/admin-auth";
import { adminMediaSrc, requestStoreOrigin } from "@/lib/media-url";
import { NewToggle } from "../new-toggle";
import { ProductDeleteButton } from "../product-delete-button";
import { ProductEditForm } from "./product-edit-form";
import { ProductVideoEditor } from "./product-video-editor";

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const origin = await requestStoreOrigin();
  const { id } = await params;
  const prisma = getPrisma();

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        isFeatured: true,
        isNew: true,
        soldCount: true,
        primaryCategoryId: true,
        primaryCategory: { select: { name: true } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 5,
          select: {
            sku: true,
            price: true,
            salePrice: true,
            stockOnHand: true,
            stockReserved: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
          select: { type: true, storageKey: true },
        },
      },
    }),
    prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  const variant = product.variants[0];
  const videoUrl = product.media.find((item) => item.type === "video")?.storageKey ?? null;
  const imageUrl = adminMediaSrc(
    product.media.find((item) => item.type === "image")?.storageKey,
    origin,
  );

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
        description={`/${product.slug} · ${product.primaryCategory.name}. Edit everything on this page, then Save.`}
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
          <p className="font-display mt-1.5 text-2xl">{variant?.stockOnHand ?? 0}</p>
        </li>
        <li className="admin-metric">
          <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Sold</p>
          <p className="font-display mt-1.5 text-2xl">{product.soldCount}</p>
        </li>
      </ul>

      <section className="admin-panel mt-8 grid gap-4 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-6">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-[#1c1814]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-[10px] tracking-wide text-muted-foreground uppercase">
              No photo
            </div>
          )}
        </div>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Details</p>
              <h2 className="font-display mt-1 text-2xl tracking-tight">Edit product</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NewToggle productId={product.id} initial={product.isNew} />
              <ProductDeleteButton
                productId={product.id}
                productName={product.name}
                redirectTo="/products"
              />
            </div>
          </div>
          <ProductEditForm
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              categoryId: product.primaryCategoryId,
              sku: variant?.sku ?? "",
              priceTaka: variant ? String(Number(variant.price) / 100) : "1500",
              salePriceTaka: variant?.salePrice != null ? String(Number(variant.salePrice) / 100) : "",
              stock: variant?.stockOnHand ?? 0,
              isFeatured: product.isFeatured,
            }}
            categories={categories}
          />
        </div>
      </section>

      <ProductVideoEditor
        productId={product.id}
        productName={product.name}
        initialUrl={videoUrl}
      />
    </div>
  );
}
