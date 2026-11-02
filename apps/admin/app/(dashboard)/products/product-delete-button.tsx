"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ProductDeleteButton({
  productId,
  productName,
  redirectTo,
}: {
  productId: string;
  productName: string;
  /** After delete, go here (e.g. product detail → list). */
  redirectTo?: string;
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
      startTransition(() => {
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      });
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
        className="admin-btn-danger h-9 px-3 text-[11px]"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
