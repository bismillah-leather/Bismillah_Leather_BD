"use client";

import { BD_DISTRICTS, formatPaisa, normalizeBdPhone } from "@bismillah/shared";
import { Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { placeOrderAction } from "@/app/checkout/actions";
import { BrandLogo } from "@/components/brand-logo";
import { CheckoutCoupon, type AppliedCoupon } from "@/components/checkout-coupon";
import { useCart } from "@/hooks/use-cart";
import { addToCart, clearCart, type CartItemView } from "@/lib/cart";

type ShippingZone = "inside" | "outside";

const SHIPPING = {
  inside: { label: "Inside Dhaka", paisa: 8_000n },
  outside: { label: "Outside Dhaka", paisa: 13_000n },
} as const;

export function CheckoutForm({
  epsPay = false,
}: {
  epsPay?: boolean;
  sslPay?: boolean;
  onlinePay?: boolean;
}) {
  const { hydrated, items, count, setQty, remove } = useCart();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [shipping, setShipping] = useState<ShippingZone>("inside");
  const [city, setCity] = useState("Dhaka");
  const startedAt = useRef(0);
  const [payment, setPayment] = useState<"cod" | "eps" | "ssl">("cod");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const orderKey = useRef("");
  const [done, setDone] = useState(false);
  const [orderItems, setOrderItems] = useState<CartItemView[]>([]);
  const [doneTotal, setDoneTotal] = useState(0n);
  const [doneShipping, setDoneShipping] = useState<ShippingZone>("inside");
  const [donePay, setDonePay] = useState<"cod" | "eps" | "ssl">("cod");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Seed cart from ?product=… before we decide empty vs ready (Buy now race fix).
  useEffect(() => {
    if (!hydrated || bootstrapped) return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("product");
    if (slug) {
      const color = params.get("color") ?? "Black";
      const qty = Math.max(1, Math.min(5, Number(params.get("qty") ?? "1") || 1));
      addToCart(slug, color, qty);
      window.history.replaceState({}, "", "/checkout");
    }
    setBootstrapped(true);
  }, [hydrated, bootstrapped]);

  const lines = items;
  const subtotal = useMemo(
    () => lines.reduce((sum, item) => sum + BigInt(item.linePaisa), 0n),
    [lines],
  );
  const shipFee = SHIPPING[shipping].paisa;
  const discount = coupon?.discountPaisa ?? 0n;
  const merchandise = subtotal > discount ? subtotal - discount : 0n;
  const total = merchandise + shipFee;

  if (done) {
    return (
      <div className="mx-auto max-w-xl border border-border bg-white">
        <div className="bg-black px-6 py-10 text-white sm:px-8">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">Thank you</p>
          <h2 className="font-display mt-3 text-4xl tracking-tight">Order {orderNumber}</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Saved. We will call to confirm {orderItems.length} item
            {orderItems.length === 1 ? "" : "s"} · {SHIPPING[doneShipping].label} ·{" "}
            {donePay === "eps" || donePay === "ssl" ? "paid online" : "cash on delivery"}.
          </p>
          <p className="mt-4 text-lg font-medium tabular-nums">{formatPaisa(doneTotal)}</p>
        </div>
        <div className="flex flex-wrap gap-3 p-6 sm:p-8">
          <Link href="/" className="inline-flex h-12 items-center bg-foreground px-5 text-sm font-medium text-background">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  if (!hydrated || !bootstrapped) {
    return <p className="text-sm text-muted-foreground">Loading checkout…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl border border-border bg-white px-6 py-14 text-center">
        <p className="font-display text-3xl tracking-tight">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">Add a product before checkout.</p>
        <Link
          href="/#all-products"
          className="mt-6 inline-flex h-12 items-center bg-foreground px-5 text-sm font-medium text-background"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mx-auto grid max-w-5xl gap-0 overflow-hidden border border-border bg-white lg:grid-cols-[minmax(0,1fr)_22.5rem]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        const data = new FormData(event.currentTarget);
        const contact = String(data.get("contact") ?? "").trim();
        const phoneRaw = String(data.get("phone") ?? "").trim() || contact;
        const phoneDigits = phoneRaw.replace(/\D/g, "");
        const phoneCandidate =
          phoneDigits.startsWith("01") || phoneDigits.startsWith("880")
            ? phoneDigits
            : phoneDigits.length === 10
              ? `0${phoneDigits}`
              : phoneDigits;
        const phone = normalizeBdPhone(phoneCandidate);
        const lastName = String(data.get("lastName") ?? "").trim();
        const address = String(data.get("address") ?? "").trim();
        const city = String(data.get("city") ?? "").trim();
        if (!phone || !lastName || !address || !city) {
          setError(
            !phone
              ? "Enter a valid Bangladesh mobile number."
              : "Fill in name, address, city, and phone.",
          );
          return;
        }
        setError("");
        setPending(true);
        if (!orderKey.current) orderKey.current = crypto.randomUUID();
        try {
          const result = await placeOrderAction({
            idempotencyKey: orderKey.current,
            contact,
            firstName: String(data.get("firstName") ?? ""),
            lastName,
            phone,
            address,
            city,
            postal: String(data.get("postal") ?? ""),
            shipping,
            customerNote: String(data.get("note") ?? ""),
            company: String(data.get("company") ?? ""),
            startedAt: startedAt.current,
            payment: payment === "eps" ? "eps" : payment === "ssl" ? "sslcommerz" : "cod",
            items: lines.map((item) => ({ slug: item.slug, color: item.color, qty: item.qty })),
            couponCode: coupon?.code,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          if (result.payUrl) {
            clearCart();
            window.location.assign(result.payUrl);
            return;
          }
          setOrderItems(lines);
          setDoneTotal(BigInt(result.totalPaisa));
          setDoneShipping(shipping);
          setDonePay(payment);
          setOrderNumber(result.number);
          clearCart();
          setDone(true);
        } catch {
          setError("Could not place the order. Check your connection and try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="order-2 border-t border-border lg:order-1 lg:border-t-0 lg:border-r">
        <input
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
        <div className="border-b border-border px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <BrandLogo size={44} className="h-10 w-10" />
            <span className="font-display text-2xl tracking-tight">Bismillah Leather</span>
          </Link>
          <p className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Cart · Information · Shipping · Payment
          </p>
        </div>

        <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9">
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-medium">Contact</h2>
              <Link href="/cart" className="text-sm text-muted-foreground underline underline-offset-4">
                Cart ({count})
              </Link>
            </div>
            <label className="grid gap-1.5 text-sm">
              <span className="sr-only">Email or mobile phone number</span>
              <input
                name="contact"
                required
                autoComplete="tel"
                placeholder="Email or mobile phone number"
                className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="offers" className="size-4 rounded border-input" />
              Email / SMS me with news and offers
            </label>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Delivery</h2>
            <div className="grid gap-3">
              <label className="grid gap-1.5 text-sm">
                <span className="sr-only">Country/Region</span>
                <select
                  name="country"
                  defaultValue="BD"
                  className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
                >
                  <option value="BD">Bangladesh</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="First name (optional)"
                  className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
                />
                <input
                  name="lastName"
                  required
                  autoComplete="family-name"
                  placeholder="Last name"
                  className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
                />
              </div>
              <input
                name="address"
                required
                autoComplete="street-address"
                placeholder="Address"
                className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
              />
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">District</span>
                <select
                  name="city"
                  required
                  value={city}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCity(next);
                    setShipping(next === "Dhaka" ? "inside" : "outside");
                  }}
                  className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
                >
                  {BD_DISTRICTS.map((district) => (
                    <option key={district}>{district}</option>
                  ))}
                </select>
              </label>
              <input
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="Phone"
                className="h-12 rounded-md border border-input bg-white px-3 outline-none focus-visible:border-foreground"
              />
              <label className="grid gap-1.5 text-sm">
                <span className="text-xs tracking-[0.12em] text-muted-foreground uppercase">Note</span>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Colour, size, or a landmark (optional)"
                  className="rounded-md border border-input bg-white px-3 py-2 outline-none focus-visible:border-foreground"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium">Shipping method</h2>
            <div className="overflow-hidden rounded-md border border-input">
              {(Object.keys(SHIPPING) as ShippingZone[]).map((zone, index) => {
                const option = SHIPPING[zone];
                const selected = shipping === zone;
                return (
                  <label
                    key={zone}
                    className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 transition ${
                      index > 0 ? "border-t border-input" : ""
                    } ${selected ? "bg-secondary/50" : "bg-white hover:bg-secondary/30"}`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex size-4 items-center justify-center rounded-full border ${
                          selected ? "border-foreground" : "border-input"
                        }`}
                      >
                        {selected ? <span className="size-2 rounded-full bg-foreground" /> : null}
                      </span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </span>
                    <span className="text-sm tabular-nums">{formatPaisa(option.paisa)}</span>
                    <input
                      type="radio"
                      name="shipping"
                      value={zone}
                      checked={selected}
                      onChange={() => setShipping(zone)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium">Payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pay when the parcel arrives, or pay now with EPS (bKash, Nagad, cards).
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer flex-col gap-2 rounded-xl border px-4 py-4 transition ${
                  payment === "cod" ? "border-foreground bg-secondary/40 shadow-sm" : "border-input bg-white hover:border-foreground/40"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Cash on delivery</span>
                  <span
                    className={`flex size-4 items-center justify-center rounded-full border ${
                      payment === "cod" ? "border-foreground" : "border-input"
                    }`}
                  >
                    {payment === "cod" ? <span className="size-2 rounded-full bg-foreground" /> : null}
                  </span>
                </span>
                <span className="text-xs leading-5 text-muted-foreground">Pay when the parcel arrives. We call first.</span>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={payment === "cod"}
                  onChange={() => setPayment("cod")}
                  className="sr-only"
                />
              </label>
              <label
                className={`flex flex-col gap-2 rounded-xl border px-4 py-4 transition ${
                  epsPay ? "cursor-pointer" : "cursor-not-allowed opacity-55"
                } ${payment === "eps" ? "border-foreground bg-secondary/40 shadow-sm" : "border-input bg-white hover:border-foreground/40"}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">Pay now · EPS</span>
                  <span
                    className={`flex size-4 items-center justify-center rounded-full border ${
                      payment === "eps" ? "border-foreground" : "border-input"
                    }`}
                  >
                    {payment === "eps" ? <span className="size-2 rounded-full bg-foreground" /> : null}
                  </span>
                </span>
                <span className="text-xs leading-5 text-muted-foreground">
                  bKash, Nagad, Rocket, Visa, Mastercard
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/payments/eps-pay.png" alt="" className="mt-1 h-6 w-auto max-w-full object-contain object-left" />
                <input
                  type="radio"
                  name="payment"
                  value="eps"
                  checked={payment === "eps"}
                  disabled={!epsPay}
                  onChange={() => setPayment("eps")}
                  className="sr-only"
                />
              </label>
            </div>
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60 lg:hidden"
          >
            {pending
              ? payment === "eps"
                ? "Opening EPS…"
                : "Placing order…"
              : payment === "eps"
                ? `Pay ${formatPaisa(total)}`
                : `Place order · ${formatPaisa(total)}`}
          </button>
          <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground lg:hidden">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={1.5} />
            <p>Secure COD · we confirm by phone before dispatch · easy returns within 7 days.</p>
          </div>
        </div>
      </div>

      <aside className="order-1 bg-secondary/45 lg:order-2">
        <div className="border-b border-border px-5 py-4 lg:border-b-0 lg:px-6 lg:pt-8">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Order summary
          </p>
        </div>
        <ul className="grid gap-5 px-5 py-5 lg:px-6">
          {lines.map((item, index) => {
            const unit = BigInt(item.unitPaisa);
            const compare = item.comparePaisa ? BigInt(item.comparePaisa) : null;
            const firstOfSlug = lines.findIndex((row) => row.slug === item.slug) === index;
            const lineOff = firstOfSlug ? (coupon?.lineDiscounts[item.slug] ?? 0n) : 0n;
            return (
              <li key={`${item.slug}-${item.color}`} className="grid gap-3">
                <div className="flex gap-3">
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-white"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                    <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                      {item.qty}
                    </span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${item.slug}`} className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{item.name}</p>
                      </Link>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {formatPaisa(BigInt(item.linePaisa))}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.color} · SKU {item.sku}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatPaisa(unit)} each
                      {compare ? (
                        <span className="ml-1.5 line-through">{formatPaisa(compare)}</span>
                      ) : null}
                      {compare ? (
                        <span className="ml-1.5 text-foreground">Sale</span>
                      ) : null}
                    </p>
                    {lineOff > 0n ? (
                      <p className="mt-1 text-xs font-medium text-emerald-800">
                        Coupon −{formatPaisa(lineOff)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pl-[4.75rem]">
                  <div className="inline-flex h-8 items-stretch border border-input bg-white">
                    <button
                      type="button"
                      aria-label={`Decrease ${item.name}`}
                      className="inline-flex w-8 items-center justify-center hover:bg-secondary"
                      onClick={() => setQty(item.slug, item.color, item.qty - 1)}
                    >
                      <Minus className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <span className="flex w-8 items-center justify-center border-x border-input text-xs tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.name}`}
                      className="inline-flex w-8 items-center justify-center hover:bg-secondary"
                      onClick={() => setQty(item.slug, item.color, item.qty + 1)}
                    >
                      <Plus className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.slug, item.color)}
                    className="inline-flex items-center gap-1 text-[11px] tracking-wide text-muted-foreground uppercase hover:text-foreground"
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="grid gap-3 border-t border-border px-5 py-5 lg:px-6">
          <CheckoutCoupon
            items={lines.map((item) => ({ slug: item.slug, qty: item.qty }))}
            applied={coupon}
            onChange={(next) => setCoupon(next)}
          />
        </div>
        <div className="grid gap-2.5 border-t border-border px-5 py-5 text-sm lg:px-6">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal · {count} item{count === 1 ? "" : "s"}</span>
            <span className="tabular-nums">{formatPaisa(subtotal)}</span>
          </div>
          {discount > 0n ? (
            <div className="flex justify-between gap-4 text-emerald-800">
              <span>Discount{coupon ? ` · ${coupon.code}` : ""}</span>
              <span className="tabular-nums">−{formatPaisa(discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Shipping · {SHIPPING[shipping].label}</span>
            <span className="tabular-nums">{formatPaisa(shipFee)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-medium">
            <span>Total</span>
            <span className="tabular-nums">
              <span className="mr-1 text-xs font-normal text-muted-foreground">BDT</span>
              {formatPaisa(total)}
            </span>
          </div>
        </div>
        <div className="hidden border-t border-border px-6 py-5 lg:block">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {pending
              ? payment === "eps"
                ? "Opening EPS…"
                : "Placing order…"
              : payment === "eps"
                ? `Pay ${formatPaisa(total)}`
                : `Place order · ${formatPaisa(total)}`}
          </button>
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={1.5} />
            <p>Secure COD · we confirm by phone before dispatch · easy returns within 7 days.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}
