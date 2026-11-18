"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CourierBarcode } from "@/components/courier-barcode";
import { CourierActions } from "../orders/courier-actions";

type OpenOrder = {
  id: string;
  number: string;
  customerPhone: string;
  totalLabel: string;
};

type BookedRow = {
  id: string;
  orderId: string;
  number: string;
  courier: string;
  barcode: string;
  shortId: string;
  status: string;
  trackingUrl: string;
  codLabel: string;
};

export function CourierDesk({
  steadfast,
  pathao,
  preferred,
  openOrders,
  booked,
}: {
  steadfast: boolean;
  pathao: boolean;
  preferred: "pathao" | "steadfast" | null;
  openOrders: OpenOrder[];
  booked: BookedRow[];
}) {
  const router = useRouter();
  const [openSelected, setOpenSelected] = useState<string[]>([]);
  const [bookedSelected, setBookedSelected] = useState<string[]>([]);
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");

  const allOpen = useMemo(() => openOrders.map((row) => row.id), [openOrders]);
  const allBooked = useMemo(() => booked.map((row) => row.id), [booked]);

  function toggle(list: string[], id: string, set: (next: string[]) => void) {
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function bulkBook(courier: "steadfast" | "pathao") {
    if (openSelected.length === 0) {
      setMessage("Select orders to book.");
      return;
    }
    setPending(courier);
    setMessage("");
    try {
      const response = await fetch("/admin/api/orders/ship-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier, orderIds: openSelected }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        booked?: number;
        failed?: Array<{ error: string }>;
        error?: string;
      };
      if (!response.ok && data.error) {
        setMessage(data.error);
        return;
      }
      const failed = data.failed?.length ?? 0;
      setMessage(
        failed
          ? `Booked ${data.booked ?? 0}. ${failed} did not book.`
          : `Booked ${data.booked ?? openSelected.length} parcels.`,
      );
      setOpenSelected([]);
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setPending("");
    }
  }

  function printLabels(ids: string[]) {
    if (ids.length === 0) {
      setMessage("Select parcels to print.");
      return;
    }
    window.open(`/admin/couriers/labels?ids=${ids.join(",")}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-8 grid gap-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Bulk booking</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tick orders, then book Steadfast or Pathao. Live booking creates real parcels.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!steadfast || pending !== "" || openSelected.length === 0}
              onClick={() => void bulkBook("steadfast")}
              className="admin-btn-primary h-9 px-3 text-[11px] disabled:opacity-40"
            >
              {pending === "steadfast" ? "Booking…" : "Book Steadfast"}
            </button>
            <button
              type="button"
              disabled={!pathao || pending !== "" || openSelected.length === 0}
              onClick={() => void bulkBook("pathao")}
              className="admin-btn-ghost h-9 px-3 text-[11px] disabled:opacity-40"
            >
              {pending === "pathao" ? "Booking…" : "Book Pathao"}
            </button>
          </div>
        </div>

        {openOrders.length === 0 ? (
          <p className="admin-panel mt-4 px-4 py-8 text-sm text-muted-foreground">
            Every open order already has a courier booking.
          </p>
        ) : (
          <ul className="admin-panel mt-4 divide-y divide-border">
            <li className="flex items-center gap-3 px-4 py-2 text-[11px] tracking-wide text-muted-foreground uppercase">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={openSelected.length === allOpen.length}
                  onChange={(e) => setOpenSelected(e.target.checked ? allOpen : [])}
                />
                Select all
              </label>
            </li>
            {openOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <label className="flex min-w-0 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={openSelected.includes(order.id)}
                    onChange={() => toggle(openSelected, order.id, setOpenSelected)}
                  />
                  <span>
                    <span className="font-medium">{order.number}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {order.customerPhone} · {order.totalLabel}
                    </span>
                  </span>
                </label>
                <CourierActions
                  orderId={order.id}
                  steadfast={steadfast}
                  pathao={pathao}
                  preferred={preferred}
                  shipment={null}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight">Barcodes & labels</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Steadfast ID and barcode print on one sheet. Select many, then print.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => printLabels(bookedSelected)}
              disabled={bookedSelected.length === 0}
              className="admin-btn-primary h-9 px-3 text-[11px] disabled:opacity-40"
            >
              Print selected
            </button>
            <button
              type="button"
              onClick={() => printLabels(allBooked)}
              disabled={booked.length === 0}
              className="admin-btn-ghost h-9 px-3 text-[11px] disabled:opacity-40"
            >
              Print all barcodes
            </button>
          </div>
        </div>

        {booked.length === 0 ? (
          <p className="admin-panel mt-4 px-4 py-8 text-sm text-muted-foreground">No parcels yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            <li className="flex items-center px-1 text-[11px] tracking-wide text-muted-foreground uppercase">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bookedSelected.length === allBooked.length}
                  onChange={(e) => setBookedSelected(e.target.checked ? allBooked : [])}
                />
                Select all labels
              </label>
            </li>
            {booked.map((shipment) => (
              <li key={shipment.id} className="admin-panel grid gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-2"
                    checked={bookedSelected.includes(shipment.id)}
                    onChange={() => toggle(bookedSelected, shipment.id, setBookedSelected)}
                  />
                  <CourierBarcode value={shipment.barcode} height={56} compact />
                </label>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {shipment.number} · {shipment.codLabel} COD
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {shipment.courier} · SF-ID {shipment.shortId} · {shipment.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/admin/couriers/labels?ids=${shipment.id}`} className="admin-btn-ghost h-9 px-3 text-[11px]">
                    Print
                  </a>
                  <CourierActions
                    orderId={shipment.orderId}
                    steadfast={steadfast}
                    pathao={pathao}
                    preferred={preferred}
                    hideBarcode
                    shipment={{
                      id: shipment.id,
                      courier: shipment.courier,
                      code: shipment.shortId,
                      barcode: shipment.barcode,
                      status: shipment.status,
                      trackingUrl: shipment.trackingUrl,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
