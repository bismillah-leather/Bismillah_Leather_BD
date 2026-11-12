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
import { adminMediaSrc, requestStoreOrigin } from "@/lib/media-url";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const prisma = getPrisma();

  const [, origin, orders] = await Promise.all([
    requireAdmin(),
    requestStoreOrigin(),
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
      landingPage: true,
      tags: true,
      placedAt: true,
      items: {
        select: {
          id: true,
          name: true,
          qty: true,
          variantLabel: true,
          lineTotal: true,
          imageKey: true,
          variant: {
            select: {
              product: {
                select: {
                  ogImageKey: true,
                  media: {
                    where: { type: "image" },
                    orderBy: { sortOrder: "asc" },
                    take: 1,
                    select: { storageKey: true },
                  },
                },
              },
            },
          },
        },
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
            const landing =
              o.landingPage && o.landingPage.startsWith("/l/") ? o.landingPage : "";
            return (
            <li key={o.id} className="grid gap-4 bg-white px-4 py-4 text-black lg:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-base font-medium text-black">
                  <span>
                    {o.number}{" "}
                    <span className="tabular-nums">{formatPaisa(o.total)}</span>
                  </span>
                  {o.tags.includes("needs-review") ? (
                    <span className="inline-flex h-6 items-center border border-black px-2 text-[10px] font-medium tracking-[0.12em] uppercase">
                      Check order
                    </span>
                  ) : null}
                  {landing ? (
                    <span className="inline-flex h-6 items-center bg-black px-2 text-[10px] font-medium tracking-[0.12em] text-white uppercase">
                      Landing · {landing.replace("/l/", "")}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {customerName} · {o.customerPhone}
                  {snap.city ? ` · ${snap.city}` : ""}
                </p>
                <ul className="mt-3 grid gap-2 text-sm text-black">
                  {o.items.map((item) => {
                    const image = adminMediaSrc(
                      item.imageKey ||
                        item.variant?.product.media[0]?.storageKey ||
                        item.variant?.product.ogImageKey,
                      origin,
                    );
                    return (
                      <li key={item.id} className="flex items-center gap-3">
                        <span className="grid size-14 shrink-0 place-items-center overflow-hidden border border-black/10 bg-neutral-100">
                          {image ? (
                            <img src={image} alt="" className="size-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-neutral-400">No photo</span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate">
                            {item.name}
                            {item.variantLabel ? ` · ${item.variantLabel}` : ""} × {item.qty}
                          </span>
                          <span className="tabular-nums text-neutral-600">{formatPaisa(item.lineTotal)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-neutral-500">
                  {landing ? "Landing page" : o.channel} ·{" "}
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
