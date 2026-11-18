import { getPrisma, loadRootEnv } from "@bismillah/db";
import { courierTrackingUrl, formatPaisa } from "@bismillah/shared";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { parcelBarcodeValue } from "@/lib/parcel-code";
import { CourierBarcode } from "@/components/courier-barcode";
import { CourierQr } from "@/components/courier-qr";
import { LabelPrintButton } from "./print-button";

function snapshotOf(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { name: "", address: "", city: "", postal: "" };
  }
  const row = value as Record<string, unknown>;
  return {
    name: typeof row.name === "string" ? row.name : "",
    address: typeof row.address === "string" ? row.address : "",
    city: typeof row.city === "string" ? row.city : "",
    postal: typeof row.postal === "string" ? row.postal : "",
  };
}

export default async function CourierLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  await requireAdmin();
  loadRootEnv();
  const merchantId = (process.env.STEADFAST_MERCHANT_ID ?? "").trim();
  const sp = await searchParams;
  const ids = (sp.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 80);
  if (ids.length === 0) notFound();

  const shipments = await getPrisma().shipment.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      courier: true,
      consignmentId: true,
      trackingCode: true,
      codAmount: true,
      bookedAt: true,
      order: {
        select: {
          number: true,
          customerPhone: true,
          customerSnapshot: true,
        },
      },
    },
  });

  if (shipments.length === 0) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Couriers</p>
          <h1 className="font-display mt-1 text-3xl tracking-tight">Shipping labels</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Same layout as Steadfast: one consignment ID, barcode, and QR.
          </p>
        </div>
        <LabelPrintButton />
      </div>

      <div className="grid gap-6 print:gap-0">
        {shipments.map((shipment) => {
          const snap = snapshotOf(shipment.order.customerSnapshot);
          const parcelId = parcelBarcodeValue(shipment.consignmentId, shipment.trackingCode);
          const address = [snap.address, snap.city, snap.postal].filter(Boolean).join(", ");
          const created = shipment.bookedAt
            ? new Intl.DateTimeFormat("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }).format(shipment.bookedAt)
            : "";
          const trackUrl =
            shipment.courier === "steadfast" || shipment.courier === "pathao"
              ? courierTrackingUrl(shipment.courier, parcelId, shipment.order.customerPhone)
              : "";
          const invoice = shipment.order.number?.trim() || "—";
          return (
            <article
              key={shipment.id}
              className="label-sheet mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 print:mx-0 print:max-w-none print:break-after-page print:border-0 print:shadow-none"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[#20c997] text-white">
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
                    <path d="M12 12v8M3 8.5l9 3.5 9-3.5" />
                  </svg>
                </span>
                <div>
                  <p className="text-lg font-semibold leading-tight">Bismillah leather</p>
                  {merchantId && shipment.courier === "steadfast" ? (
                    <p className="text-[11px] text-neutral-500">Merchant ID: {merchantId}</p>
                  ) : (
                    <p className="text-[11px] text-neutral-500">
                      {shipment.courier === "steadfast" ? "Steadfast" : "Pathao"} parcel
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5">
                {parcelId ? <CourierBarcode value={parcelId} height={78} /> : (
                  <p className="text-center text-sm text-neutral-500">No courier ID yet.</p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-[108px_1fr] items-start gap-4">
                {trackUrl ? <CourierQr value={trackUrl} size={108} /> : <div />}
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                  <dt className="text-neutral-500">Invoice</dt>
                  <dd className="text-right font-medium">{invoice}</dd>
                  <dt className="text-neutral-500">SF-ID</dt>
                  <dd className="text-right font-medium tabular-nums">{parcelId || "—"}</dd>
                  <dt className="text-neutral-500">Delivery</dt>
                  <dd className="text-right">Home</dd>
                  <dt className="text-neutral-500">Weight</dt>
                  <dd className="text-right">N/G</dd>
                </dl>
              </div>

              <div className="mt-5 grid gap-1.5 text-sm">
                <p>
                  <span className="inline-block w-16 text-neutral-500">Name</span>
                  <span className="font-medium">{snap.name || "Customer"}</span>
                </p>
                <p>
                  <span className="inline-block w-16 text-neutral-500">Phone</span>
                  <span>{shipment.order.customerPhone}</span>
                </p>
                <p>
                  <span className="inline-block w-16 text-neutral-500">Address</span>
                  <span>{address || "—"}</span>
                </p>
              </div>

              <p className="mt-5 flex items-center justify-between rounded-lg bg-neutral-950 px-4 py-3 text-sm font-semibold text-white">
                <span>Cash on Delivery</span>
                <span>{formatPaisa(shipment.codAmount)}</span>
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                {created ? <p>Created: {created}</p> : <span />}
                {shipment.courier === "steadfast" ? <p>steadfast.com.bd</p> : <span />}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
