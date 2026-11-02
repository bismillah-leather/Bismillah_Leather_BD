"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function StockEditor({
  variantId,
  stockOnHand,
  stockReserved,
}: {
  variantId: string;
  stockOnHand: number;
  stockReserved: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stockOnHand));
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(stockOnHand));
  }, [stockOnHand]);

  const next = Number(value);
  const valid = Number.isInteger(next) && next >= 0;
  const dirty = valid && next !== stockOnHand;
  const available = valid ? Math.max(0, next - stockReserved) : 0;

  function step(delta: number) {
    const base = Number.isInteger(next) && next >= 0 ? next : stockOnHand;
    setValue(String(Math.max(0, base + delta)));
    setMsg(null);
  }

  async function save() {
    setMsg(null);
    if (!valid) {
      setMsg("Use a whole number.");
      return;
    }
    if (!dirty) return;
    const res = await fetch(`/admin/api/inventory/${variantId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockOnHand: next }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg(data.error ?? "Could not save.");
      return;
    }
    setMsg("Saved");
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid justify-items-start gap-1.5 sm:justify-items-end">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => step(-1)} className="admin-btn-ghost h-9 w-9 px-0 text-base" aria-label="Decrease stock">
          −
        </button>
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setMsg(null);
          }}
          className="admin-field h-9 w-16 px-2 text-center tabular-nums"
          aria-label="On hand"
        />
        <button type="button" onClick={() => step(1)} className="admin-btn-ghost h-9 w-9 px-0 text-base" aria-label="Increase stock">
          +
        </button>
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() => void save()}
          className="admin-btn-primary h-9 px-3 text-[11px]"
        >
          {pending ? "Saving" : "Save"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {valid && next < stockReserved
          ? `Below ${stockReserved} reserved`
          : `${available} free to sell`}
        {msg ? ` · ${msg}` : ""}
      </p>
    </div>
  );
}
