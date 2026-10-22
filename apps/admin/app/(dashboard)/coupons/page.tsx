import { getPrisma } from "@bismillah/db";
import { formatPaisa } from "@bismillah/shared";
import { AdminPageHeader } from "@/components/admin-page-header";
import { ToggleButton } from "@/components/toggle-button";
import { requireAdmin } from "@/lib/admin-auth";
import { CouponCreateForm } from "./coupon-create-form";

function formatCouponValue(type: string, value: bigint) {
  if (type === "percent") return `${Number(value) / 100}%`;
  return formatPaisa(value);
}

export default async function CouponsPage() {
  await requireAdmin();
  const prisma = getPrisma();
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      isActive: true,
      usageLimit: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      _count: { select: { redemptions: true } },
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Promotions"
        title="Coupons"
        description="Create storewide codes. Percent is stored as basis points; fixed as paisa."
      />

      <div className="mt-8 max-w-xl">
        <CouponCreateForm />
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {coupons.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">No coupons yet.</li>
        ) : (
          coupons.map((c) => (
            <li
              key={c.id}
              className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm font-medium tracking-wide">{c.code}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.type} · {formatCouponValue(c.type, c.value)} · redeemed{" "}
                  {c._count.redemptions}
                  {c.usageLimit != null ? ` / ${c.usageLimit}` : ""} · created{" "}
                  {c.createdAt.toLocaleDateString()}
                </p>
              </div>
              <ToggleButton
                endpoint={`/admin/api/coupons/${c.id}`}
                flagKey="isActive"
                active={c.isActive}
                activeLabel="Active"
                inactiveLabel="Off"
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
