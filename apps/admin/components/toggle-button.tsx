"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ToggleButton({
  endpoint,
  flagKey,
  active,
  activeLabel,
  inactiveLabel,
}: {
  endpoint: string;
  flagKey: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(active);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    const next = !on;
    setOn(next);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [flagKey]: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setOn(!next);
        setError(data.error ?? "Failed");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setOn(!next);
      setError("Network error");
    }
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => void toggle()}
        className={`h-9 px-3 text-xs tracking-wide uppercase transition ${
          on
            ? "border border-primary/40 bg-primary/15 text-primary"
            : "border border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {on ? activeLabel : inactiveLabel}
      </button>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
