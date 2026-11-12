"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function NewToggle({
  productId,
  initial,
  onChange,
}: {
  productId: string;
  initial: boolean;
  onChange?: (on: boolean) => void;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setOn(initial);
  }, [initial]);

  async function toggle() {
    const next = !on;
    setOn(next);
    onChange?.(next);
    setPending(true);
    try {
      const res = await fetch(`/admin/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isNew: next }),
      });
      if (!res.ok) {
        setOn(!next);
        onChange?.(!next);
        return;
      }
      router.refresh();
    } catch {
      setOn(!next);
      onChange?.(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      aria-pressed={on}
      className={`inline-flex h-9 items-center px-3 text-[11px] font-semibold tracking-[0.16em] uppercase transition disabled:opacity-60 ${
        on ? "bg-[#e10600] text-white" : "border border-black/20 bg-white text-black hover:border-black"
      }`}
    >
      {pending ? "Saving" : "New"}
    </button>
  );
}
