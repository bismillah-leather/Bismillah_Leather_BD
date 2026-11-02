"use client";

import { formatPaisa, percentOff } from "@bismillah/shared";
import Link from "next/link";

export type CouponCatalogItem = {
  id: string;
  name: string;
  pricePaisa: string;
  image: string | null;
};

export function priceAfterCoupon(
  pricePaisa: string,
  type: "percent" | "fixed",
  amount: string,
) {
  const price = BigInt(pricePaisa);
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return price;
  if (type === "percent") {
    const points = BigInt(Math.round(Math.min(100, value) * 100));
    return price - percentOff(price, points);
  }
  const off = BigInt(Math.round(value * 100));
  return price > off ? price - off : 0n;
}

export function ProductPicker({
  catalog,
  selected,
  type,
  amount,
  onChange,
}: {
  catalog: CouponCatalogItem[];
  selected: string[];
  type: "percent" | "fixed";
  amount: string;
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Products</p>
        <p className="text-xs text-muted-foreground">
          {selected.length === 0 ? "Whole store" : `${selected.length} selected`}
        </p>
      </div>
      <ul className="admin-panel max-h-72 divide-y divide-border overflow-y-auto">
        {catalog.length === 0 ? (
          <li className="px-3 py-6 text-sm text-muted-foreground">No products to attach.</li>
        ) : (
          catalog.map((product) => {
            const on = selected.includes(product.id);
            const next = priceAfterCoupon(product.pricePaisa, type, amount);
            return (
              <li key={product.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(product.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="size-10 shrink-0 overflow-hidden rounded-md bg-[#1c1814]">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt="" className="size-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  <span className="shrink-0 text-right text-xs tabular-nums">
                    {on ? (
                      <>
                        <span className="mr-2 text-muted-foreground line-through">
                          {formatPaisa(BigInt(product.pricePaisa))}
                        </span>
                        <span className="text-[#e4c98a]">{formatPaisa(next)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{formatPaisa(BigInt(product.pricePaisa))}</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export function CouponProductList({
  products,
  type,
  amount,
}: {
  products: CouponCatalogItem[];
  type: "percent" | "fixed";
  amount: string;
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No products picked. This code applies to the whole order.
      </p>
    );
  }

  return (
    <ul className="grid gap-2">
      {products.map((product) => {
        const next = priceAfterCoupon(product.pricePaisa, type, amount);
        return (
          <li key={product.id} className="flex items-center gap-3">
            <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-[#1c1814]">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt="" className="size-full object-cover" />
              ) : null}
            </span>
            <Link href={`/products/${product.id}`} className="min-w-0 flex-1 truncate text-sm hover:text-primary">
              {product.name}
            </Link>
            <span className="shrink-0 text-right text-xs tabular-nums">
              <span className="mr-2 text-muted-foreground line-through">
                {formatPaisa(BigInt(product.pricePaisa))}
              </span>
              <span className="text-[#e4c98a]">{formatPaisa(next)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
