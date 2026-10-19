"use client";

import { formatPaisa, normalizeBdPhone, type ProductView } from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const DISTRICTS = [
  "Dhaka",
  "Gazipur",
  "Narayanganj",
  "Chattogram",
  "Sylhet",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Rangpur",
  "Mymensingh",
] as const;

export function CheckoutForm({
  product,
  color: initialColor,
}: {
  product: ProductView | undefined;
  color: string;
}) {
  const colors = useMemo(() => [...(product?.colors ?? [])], [product]);
  const [color, setColor] = useState(initialColor || colors[0] || "");
  const [district, setDistrict] = useState("");
  const [customDistrict, setCustomDistrict] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const price = product ? BigInt(product.pricePaisa) : 0n;
  const compare = product?.comparePaisa ? BigInt(product.comparePaisa) : null;
  const delivery = district === "Dhaka" ? 8_000n : district ? 13_000n : 8_000n;
  const total = price + delivery;

  if (done && product) {
    return (
      <div className="mt-8 border border-border bg-white p-6 sm:p-8">
        <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Request received</p>
        <h2 className="font-display mt-2 text-3xl sm:text-4xl">We will call to confirm.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {product.name} · {color}
          {district ? ` · ${district}` : ""}. Cash on delivery — we confirm before the parcel goes
          out.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center border border-foreground px-4 text-sm transition hover:bg-foreground hover:text-background"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const phone = normalizeBdPhone(String(data.get("phone") ?? ""));
        const name = String(data.get("name") ?? "").trim();
        const address = String(data.get("address") ?? "").trim();
        const selectedDistrict = String(data.get("district") ?? district).trim();
        if (!product) {
          setError("Choose a product, then come back to check out.");
          return;
        }
        if (!name || !phone || !selectedDistrict) {
          setError(phone ? "Fill in name, phone, and district." : "Enter a Bangladesh mobile number.");
          return;
        }
        if (!address) {
          setError("Add your full delivery address.");
          return;
        }
        setError("");
        setDone(true);
      }}
    >
      <div className="grid gap-5">
        {product ? (
          <div className="border border-border bg-white">
            <div className="grid gap-4 p-4 sm:grid-cols-[7.5rem_1fr] sm:p-5">
              <Link
                href={`/product/${product.slug}`}
                className="relative aspect-[3/4] overflow-hidden bg-secondary sm:aspect-square"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex bg-foreground px-2 py-1 text-[10px] tracking-[0.14em] text-background uppercase">
                    COD
                  </span>
                  {compare ? (
                    <span className="inline-flex border border-border px-2 py-1 text-[10px] tracking-[0.14em] uppercase">
                      Sale
                    </span>
                  ) : null}
                  <span className="inline-flex border border-border px-2 py-1 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                    {product.kind}
                  </span>
                </div>
                <Link href={`/product/${product.slug}`}>
                  <h2 className="font-display mt-3 text-2xl leading-tight tracking-tight">
                    {product.name}
                  </h2>
                </Link>
                <p className="mt-1 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                  {product.sku}
                </p>
                <p className="mt-3 text-sm">
                  <span className="font-medium">{formatPaisa(price)}</span>
                  {compare ? (
                    <span className="ml-2 text-muted-foreground line-through">
                      {formatPaisa(compare)}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            {colors.length > 0 ? (
              <div className="border-t border-border px-4 py-4 sm:px-5">
                <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((option) => {
                    const selected = option === color;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setColor(option)}
                        className={`inline-flex h-10 items-center border px-3.5 text-sm transition ${
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-input bg-white hover:border-foreground"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="color" value={color} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="border border-border bg-secondary/50 p-5 text-sm text-muted-foreground">
            No product selected.{" "}
            <Link href="/#all-products" className="text-foreground underline underline-offset-4">
              Browse the catalog
            </Link>{" "}
            and tap Buy now.
          </div>
        )}

        <div className="border border-border bg-secondary/40 p-4 text-sm sm:p-5">
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Order total</p>
          <dl className="mt-3 grid gap-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Item</dt>
              <dd>{product ? formatPaisa(price) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{formatPaisa(delivery)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
              <dt>Total</dt>
              <dd>{product ? formatPaisa(total) : "—"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Dhaka ৳80 · Outside Dhaka ৳130 · pay cash on delivery
          </p>
        </div>
      </div>

      <div className="grid gap-4 self-start">
        <div>
          <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Delivery details</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We call this number before dispatch.
          </p>
        </div>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Name</span>
          <input
            name="name"
            required
            autoComplete="name"
            placeholder="Your full name"
            className="h-12 border border-input bg-white px-3 outline-none focus-visible:border-foreground"
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Phone</span>
          <input
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            className="h-12 border border-input bg-white px-3 outline-none focus-visible:border-foreground"
          />
        </label>

        <fieldset className="grid gap-1.5">
          <legend className="text-xs tracking-[0.12em] text-muted-foreground uppercase">
            District
          </legend>
          <div className="flex flex-wrap gap-2">
            {DISTRICTS.map((item) => {
              const selected = !customDistrict && district === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCustomDistrict(false);
                    setDistrict(item);
                  }}
                  className={`inline-flex h-10 items-center border px-3 text-sm transition ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-white hover:border-foreground"
                  }`}
                >
                  {item}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setCustomDistrict(true);
                setDistrict("");
              }}
              className={`inline-flex h-10 items-center border px-3 text-sm transition ${
                customDistrict
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-white hover:border-foreground"
              }`}
            >
              Other
            </button>
          </div>
          <input type="hidden" name="district" value={district} />
          {customDistrict ? (
            <input
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              placeholder="Type your district"
              className="mt-1 h-12 border border-input bg-white px-3 outline-none focus-visible:border-foreground"
            />
          ) : null}
        </fieldset>

        <label className="grid gap-1.5 text-sm">
          <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Address</span>
          <textarea
            name="address"
            required
            rows={3}
            autoComplete="street-address"
            placeholder="House, road, area"
            className="resize-y border border-input bg-white px-3 py-3 outline-none focus-visible:border-foreground"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={!product}
          className="h-12 bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
        >
          Place COD order
        </button>
      </div>
    </form>
  );
}
