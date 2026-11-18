"use client";

import { formatPaisa } from "@bismillah/shared";
import { Check, Ticket, X } from "lucide-react";
import { useEffect, useState } from "react";
import { quoteCouponAction } from "@/app/checkout/actions";

export type AppliedCoupon = {
  code: string;
  label: string;
  discountPaisa: bigint;
  lineDiscounts: Record<string, bigint>;
};

export function CheckoutCoupon({
  items,
  phone,
  applied,
  onChange,
}: {
  items: Array<{ slug: string; qty: number }>;
  phone?: string;
  applied: AppliedCoupon | null;
  onChange: (next: AppliedCoupon | null, error?: string) => void;
}) {
  const [code, setCode] = useState(applied?.code ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const cartKey = items.map((item) => `${item.slug}:${item.qty}`).join("|");

  useEffect(() => {
    if (!applied) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void quoteCouponAction({
        code: applied.code,
        items,
        phone,
      }).then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          onChange(null, result.error);
          setError(result.error);
          return;
        }
        onChange({
          code: result.code,
          label: result.label,
          discountPaisa: BigInt(result.discountPaisa),
          lineDiscounts: Object.fromEntries(
            result.lineDiscounts.map((line) => [line.slug, BigInt(line.discountPaisa)]),
          ),
        });
        setError("");
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Re-validate when qty / mix changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, applied?.code, phone]);

  async function apply() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const result = await quoteCouponAction({ code, items, phone });
      if (!result.ok) {
        onChange(null, result.error);
        setError(result.error);
        return;
      }
      setCode(result.code);
      onChange({
        code: result.code,
        label: result.label,
        discountPaisa: BigInt(result.discountPaisa),
        lineDiscounts: Object.fromEntries(
          result.lineDiscounts.map((line) => [line.slug, BigInt(line.discountPaisa)]),
        ),
      });
    } catch {
      setError("Could not check this coupon. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (applied) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-950">
              <Check className="size-4 shrink-0" strokeWidth={2} />
              {applied.code}
            </p>
            <p className="mt-0.5 text-xs text-emerald-800/80">
              {applied.label} · −{formatPaisa(applied.discountPaisa)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              onChange(null);
            }}
            className="inline-flex size-8 items-center justify-center rounded-full text-emerald-900/70 hover:bg-emerald-100 hover:text-emerald-950"
            aria-label="Remove coupon"
          >
            <X className="size-4" />
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        <Ticket className="size-3.5" strokeWidth={1.75} />
        Coupon
      </p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void apply();
            }
          }}
          placeholder="CODE"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-white px-3 text-sm tracking-[0.12em] uppercase outline-none focus-visible:border-foreground"
        />
        <button
          type="button"
          disabled={pending || code.trim().length < 3}
          onClick={() => void apply()}
          className="h-11 shrink-0 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
        >
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
