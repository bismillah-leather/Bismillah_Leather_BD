"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourierActions({
  orderId,
  steadfast,
  pathao,
  shipment,
}: {
  orderId: string;
  steadfast: boolean;
  pathao: boolean;
  shipment: {
    id: string;
    courier: string;
    code: string;
    status: string;
    trackingUrl: string;
  } | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  async function book(courier: "steadfast" | "pathao") {
    setPending(courier);
    setError("");
    try {
      const response = await fetch(`/admin/api/orders/${orderId}/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Booking failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending("");
    }
  }

  async function refresh() {
    if (!shipment) return;
    setPending("refresh");
    setError("");
    try {
      const response = await fetch(`/admin/api/shipments/${shipment.id}/refresh`, { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not refresh.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending("");
    }
  }

  if (shipment) {
    return (
      <div className="mt-3 grid gap-2">
        <p className="text-xs text-neutral-600">
          {shipment.courier} · {shipment.code} · {shipment.status}
        </p>
        <div className="flex flex-wrap gap-2">
          {shipment.trackingUrl ? (
            <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="admin-btn-ghost h-9 px-3 text-[11px]">
              Track
            </a>
          ) : null}
          <button type="button" onClick={() => void refresh()} disabled={pending !== ""} className="admin-btn-ghost h-9 px-3 text-[11px]">
            {pending === "refresh" ? "Checking…" : "Refresh status"}
          </button>
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!steadfast || pending !== ""}
          onClick={() => void book("steadfast")}
          className="admin-btn-primary h-9 px-3 text-[11px] disabled:opacity-40"
        >
          {pending === "steadfast" ? "Booking…" : "Steadfast"}
        </button>
        <button
          type="button"
          disabled={!pathao || pending !== ""}
          onClick={() => void book("pathao")}
          className="admin-btn-ghost h-9 px-3 text-[11px] disabled:opacity-40"
        >
          {pending === "pathao" ? "Booking…" : "Pathao"}
        </button>
      </div>
      {!steadfast && !pathao ? (
        <p className="text-xs text-neutral-500">Add the courier keys in env to book a parcel.</p>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
