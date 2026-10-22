"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StockEditor({
  variantId,
  stockOnHand,
}: {
  variantId: string;
  stockOnHand: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stockOnHand));
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      setMsg("Invalid");
      return;
    }
    const res = await fetch(`/admin/api/inventory/${variantId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockOnHand: next }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg("Saved");
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="admin-field h-9 w-24 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => void save()}
        className="h-9 border border-border px-3 text-xs tracking-wide uppercase transition hover:border-primary/40"
      >
        Set
      </button>
      {msg ? <span className="text-[11px] text-muted-foreground">{msg}</span> : null}
    </div>
  );
}
