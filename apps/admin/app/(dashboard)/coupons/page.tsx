import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { adminMediaSrc } from "@/lib/media-url";
import { CouponCreateForm } from "./coupon-create-form";
import { CouponRow } from "./coupon-row";
import type { CouponCatalogItem } from "./coupon-products";

function formatCouponValue(type: string, value: bigint) {
  if (type === "percent") return `${Number(value) / 100}%`;
  return formatPaisa(value);
}

export default async function CouponsPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const [coupons, products] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        isActive: true,
        usageLimit: true,
        createdAt: true,
        products: { select: { productId: true } },
        _count: { select: { redemptions: true } },
      },
    }),
    prisma.product.findMany({
      where: { deletedAt: null, status: { not: "archived" } },
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { price: true },
        },
        media: {
          where: { type: "image" },
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { storageKey: true },
        },
      },
    }),
  ]);

  const catalog: CouponCatalogItem[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    pricePaisa: (product.variants[0]?.price ?? 0n).toString(),
    image: adminMediaSrc(product.media[0]?.storageKey),
  }));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title="Coupons"
        description="Pick the products a code applies to. Click the code to see those products and the reduced price."
      />

      <div className="mt-8 max-w-xl">
        <CouponCreateForm catalog={catalog} />
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {coupons.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">No coupons yet.</li>
        ) : (
          coupons.map((c) => (
            <CouponRow
              key={c.id}
              id={c.id}
              code={c.code}
              type={c.type}
              amount={String(Number(c.value) / 100)}
              isActive={c.isActive}
              catalog={catalog}
              productIds={c.products.map((link) => link.productId)}
              meta={`${c.type} · ${formatCouponValue(c.type, c.value)} · redeemed ${c._count.redemptions}${
                c.usageLimit != null ? ` / ${c.usageLimit}` : ""
              } · created ${c.createdAt.toLocaleDateString()}`}
            />
          ))
        )}
      </ul>
    </div>
  );
}
