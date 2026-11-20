"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: "approved" | "rejected") {
    setBusy(next);
    setError(null);
    try {
      const res = await fetch(`/admin/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not update.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setStatus("approved")}
          className="admin-btn-primary h-9 px-3 text-[11px]"
        >
          {busy === "approved" ? "…" : "Approve"}
        </button>
      ) : null}
      {status !== "rejected" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setStatus("rejected")}
          className="admin-btn-ghost h-9 px-3 text-[11px]"
        >
          {busy === "rejected" ? "…" : "Reject"}
        </button>
      ) : null}
      {error ? <p className="w-full text-xs text-[#f0b2a6]">{error}</p> : null}
    </div>
  );
}
