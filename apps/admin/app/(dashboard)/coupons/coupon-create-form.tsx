"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductPicker, type CouponCatalogItem } from "./coupon-products";

export function CouponCreateForm({ catalog }: { catalog: CouponCatalogItem[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState("10");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/admin/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type, amount: Number(amount), productIds }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create.");
        return;
      }
      setMsg(`Created ${data.code}`);
      setCode("");
      setProductIds([]);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel grid gap-4 p-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm sm:col-span-2">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Code
        </span>
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="LEATHER10"
          className="admin-field"
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Type
        </span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "percent" | "fixed")}
          className="admin-field"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed ৳</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {type === "percent" ? "Percent" : "Taka"}
        </span>
        <input
          required
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="admin-field"
        />
      </label>
      <div className="sm:col-span-2">
        <ProductPicker
          catalog={catalog}
          selected={productIds}
          type={type}
          amount={amount}
          onChange={setProductIds}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Creating…" : "Create coupon"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </form>
  );
}
