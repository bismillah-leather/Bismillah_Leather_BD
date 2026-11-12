import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import { AdminPageHeader } from "@/components/admin-page-header";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCatalogPicker } from "@/lib/catalog-picker";
import { requestStoreOrigin } from "@/lib/media-url";
import { CouponCreateForm } from "./coupon-create-form";
import { CouponRow } from "./coupon-row";
import type { CouponCatalogItem } from "./coupon-products";

function formatCouponValue(type: string, value: bigint) {
  if (type === "percent") return `${Number(value) / 100}%`;
  return formatPaisa(value);
}

export default async function CouponsPage() {
  const origin = await requestStoreOrigin();
  const prisma = getPrisma();
  const [, coupons, picker] = await Promise.all([
    requireAdmin(),
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
    loadCatalogPicker(origin),
  ]);

  const catalog: CouponCatalogItem[] = picker.map((product) => ({
    id: product.id,
    name: product.name,
    pricePaisa: product.pricePaisa,
    image: product.image || null,
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
