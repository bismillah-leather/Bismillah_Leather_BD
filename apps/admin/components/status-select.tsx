"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function StatusSelect({
  endpoint,
  field,
  value,
  options,
  bodyKey = "value",
}: {
  endpoint: string;
  field?: string;
  value: string;
  options: readonly string[];
  bodyKey?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: string) {
    setError(null);
    const prev = current;
    setCurrent(next);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          field ? { field, [bodyKey]: next } : { [bodyKey]: next },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCurrent(prev);
        setError(data.error ?? "Update failed");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setCurrent(prev);
      setError("Network error");
    }
  }

  return (
    <div className="grid gap-1">
      <select
        value={current}
        disabled={pending}
        onChange={(e) => void onChange(e.target.value)}
        className="admin-field h-9 text-xs"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
