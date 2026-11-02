"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToggleButton } from "@/components/toggle-button";
import { CouponProductList, ProductPicker, type CouponCatalogItem } from "./coupon-products";

export function CouponRow({
  id,
  code,
  type,
  amount,
  meta,
  isActive,
  catalog,
  productIds,
}: {
  id: string;
  code: string;
  type: "percent" | "fixed";
  amount: string;
  meta: string;
  isActive: boolean;
  catalog: CouponCatalogItem[];
  productIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [nextCode, setNextCode] = useState(code);
  const [nextType, setNextType] = useState(type);
  const [nextAmount, setNextAmount] = useState(amount);
  const [nextProducts, setNextProducts] = useState(productIds);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/admin/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: nextCode,
          type: nextType,
          amount: Number(nextAmount),
          productIds: nextProducts,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setError(null);
    if (!window.confirm(`Delete coupon ${code}?`)) return;
    setPending(true);
    try {
      const res = await fetch(`/admin/api/coupons/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="grid gap-3 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setShowProducts((value) => !value)}
            className="text-left text-sm font-medium tracking-wide hover:text-primary"
          >
            {code}
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {meta}
            {" · "}
            {productIds.length === 0 ? "whole store" : `${productIds.length} products`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleButton
            endpoint={`/admin/api/coupons/${id}`}
            flagKey="isActive"
            active={isActive}
            activeLabel="Active"
            inactiveLabel="Off"
          />
          <button
            type="button"
            onClick={() => setShowProducts((value) => !value)}
            className="admin-btn-ghost h-9 px-3 text-[11px]"
          >
            {showProducts ? "Hide" : "Products"}
          </button>
          <button type="button" onClick={() => setOpen((v) => !v)} className="admin-btn-ghost h-9 px-3 text-[11px]">
            {open ? "Close" : "Edit"}
          </button>
          <button type="button" disabled={pending} onClick={() => void remove()} className="admin-btn-danger h-9 px-3 text-[11px]">
            Delete
          </button>
        </div>
      </div>
      {open ? (
        <form onSubmit={save} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-4">
          <input value={nextCode} onChange={(e) => setNextCode(e.target.value.toUpperCase())} className="admin-field h-9" required />
          <select value={nextType} onChange={(e) => setNextType(e.target.value as "percent" | "fixed")} className="admin-field h-9">
            <option value="percent">Percent</option>
            <option value="fixed">Fixed ৳</option>
          </select>
          <input type="number" min={1} value={nextAmount} onChange={(e) => setNextAmount(e.target.value)} className="admin-field h-9" required />
          <button type="submit" disabled={pending} className="admin-btn-primary h-9 px-3 text-[11px]">
            {pending ? "Saving…" : "Save edit"}
          </button>
          <div className="sm:col-span-4">
            <ProductPicker
              catalog={catalog}
              selected={nextProducts}
              type={nextType}
              amount={nextAmount}
              onChange={setNextProducts}
            />
          </div>
        </form>
      ) : null}
      {showProducts ? (
        <div className="border-t border-border pt-3">
          <CouponProductList
            products={catalog.filter((product) => productIds.includes(product.id))}
            type={type}
            amount={amount}
          />
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </li>
  );
}
