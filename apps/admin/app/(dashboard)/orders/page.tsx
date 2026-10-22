import { getPrisma } from "@bismillah/db";
import {
  FULFILLMENT_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  formatPaisa,
} from "@bismillah/shared";
import { Suspense } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminSearch } from "@/components/admin-search";
import { StatusSelect } from "@/components/status-select";
import { requireAdmin } from "@/lib/admin-auth";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const prisma = getPrisma();

  const orders = await prisma.order.findMany({
    where: q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { placedAt: "desc" },
    take: 60,
    select: {
      id: true,
      number: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      total: true,
      customerPhone: true,
      channel: true,
      placedAt: true,
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Confirm, fulfill, and track COD orders from the storefront."
      />

      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminSearch placeholder="Search order # or phone…" />
        </Suspense>
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {orders.length === 0 ? (
          <li className="px-4 py-10 text-sm text-muted-foreground">No orders yet.</li>
        ) : (
          orders.map((o) => (
            <li key={o.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-medium">
                  {o.number}{" "}
                  <span className="text-primary">{formatPaisa(o.total)}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {o.customerPhone} · {o.channel} ·{" "}
                  {o.placedAt.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                <div>
                  <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                    Status
                  </p>
                  <StatusSelect
                    endpoint={`/admin/api/orders/${o.id}/status`}
                    field="status"
                    value={o.status}
                    options={ORDER_STATUSES}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                    Payment
                  </p>
                  <StatusSelect
                    endpoint={`/admin/api/orders/${o.id}/status`}
                    field="paymentStatus"
                    value={o.paymentStatus}
                    options={PAYMENT_STATUSES}
                  />
                </div>
                <div>
                  <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                    Fulfillment
                  </p>
                  <StatusSelect
                    endpoint={`/admin/api/orders/${o.id}/status`}
                    field="fulfillmentStatus"
                    value={o.fulfillmentStatus}
                    options={FULFILLMENT_STATUSES}
                  />
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
