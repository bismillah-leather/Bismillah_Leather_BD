"use client";

import { formatPaisa, normalizeBdPhone, type ProductView } from "@bismillah/shared";
import { useState } from "react";

export function CheckoutForm({
  product,
  color,
}: {
  product: ProductView | undefined;
  color: string;
}) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const price = product ? BigInt(product.pricePaisa) : 0n;
  const delivery = 8_000n;

  if (done && product) {
    return (
      <div className="mt-8 rounded-md border border-border bg-white p-5">
        <p className="text-xs tracking-[0.16em] uppercase">Request received</p>
        <h2 className="font-display mt-2 text-3xl">We will call to confirm.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {product.name} · {color}. This screen is the checkout. The order is saved in the shop
          system when payments and courier booking go live.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const phone = normalizeBdPhone(String(data.get("phone") ?? ""));
        const name = String(data.get("name") ?? "").trim();
        const district = String(data.get("district") ?? "").trim();
        if (!name || !phone || !district || !product) {
          setError(phone ? "Fill in name, phone, and district." : "Enter a Bangladesh mobile number.");
          return;
        }
        setError("");
        setDone(true);
      }}
    >
      {product ? (
        <div className="rounded-md border border-border bg-white p-4 text-sm">
          <p className="font-medium">{product.name}</p>
          <p className="text-muted-foreground">{color}</p>
          <p className="mt-2">
            {formatPaisa(price)} + {formatPaisa(delivery)} delivery
          </p>
          <p className="mt-1 font-medium">Total {formatPaisa(price + delivery)}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Choose a product, then come back to check out.</p>
      )}
      <label className="grid gap-1 text-sm">
        Name
        <input name="name" required autoComplete="name" className="h-12 rounded-md border border-input bg-white px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        Phone
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          className="h-12 rounded-md border border-input bg-white px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        District
        <input name="district" required autoComplete="address-level2" className="h-12 rounded-md border border-input bg-white px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        Address
        <input name="address" autoComplete="street-address" className="h-12 rounded-md border border-input bg-white px-3" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={!product}
        className="h-12 rounded-md bg-foreground text-sm font-medium text-background disabled:opacity-50"
      >
        Place COD order
      </button>
    </form>
  );
}
