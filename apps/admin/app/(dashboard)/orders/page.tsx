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
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const prisma = getPrisma();

  const [, orders] = await Promise.all([
    requireAdmin(),
    prisma.order.findMany({
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
      customerSnapshot: true,
      channel: true,
      placedAt: true,
      items: {
        select: { id: true, name: true, qty: true, variantLabel: true, lineTotal: true },
      },
    },
    }),
  ]);

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
          orders.map((o) => {
            const snap =
              o.customerSnapshot && typeof o.customerSnapshot === "object" && !Array.isArray(o.customerSnapshot)
                ? (o.customerSnapshot as { name?: string; city?: string })
                : {};
            const customerName = typeof snap.name === "string" && snap.name.trim() ? snap.name : "Customer";
            return (
            <li key={o.id} className="grid gap-4 bg-white px-4 py-4 text-black lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="text-base font-medium text-black">
                  {o.number}{" "}
                  <span className="tabular-nums">{formatPaisa(o.total)}</span>
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {customerName} · {o.customerPhone}
                  {snap.city ? ` · ${snap.city}` : ""}
                </p>
                <ul className="mt-2 grid gap-1 text-sm text-black">
                  {o.items.map((item) => (
                    <li key={item.id}>
                      {item.name}
                      {item.variantLabel ? ` · ${item.variantLabel}` : ""} × {item.qty}
                      <span className="ml-2 tabular-nums text-neutral-600">{formatPaisa(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-neutral-500">
                  {o.channel} ·{" "}
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
            );
          })
        )}
      </ul>
    </div>
  );
}
