"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ProductDeleteButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);
    const ok = window.confirm(
      `Delete “${productName}”? It will be archived and hidden from the storefront.`,
    );
    if (!ok) return;

    try {
      const res = await fetch(`/admin/api/products/${productId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="grid gap-1 justify-items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => void onDelete()}
        className="h-9 border border-destructive/35 px-3 text-xs tracking-wide text-destructive uppercase transition hover:bg-destructive/10 disabled:opacity-50"
      >
        {pending ? "…" : "Delete"}
      </button>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
