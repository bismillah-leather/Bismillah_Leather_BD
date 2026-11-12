"use client";

import { BD_DISTRICTS, formatPaisa, normalizeBdPhone } from "@bismillah/shared";
import { useRef, useState } from "react";
import { placeOrderAction } from "@/app/checkout/actions";

export type LandingProductPick = {
  slug: string;
  name: string;
  image: string;
  pricePaisa: string;
  comparePaisa: string;
  colors: string[];
};

const SHIP = { inside: 8_000n, outside: 13_000n };

function money(paisa: string) {
  try {
    return BigInt(paisa);
  } catch {
    return 0n;
  }
}

type OrderLine = { key: string; slug: string; color: string; qty: number };

export function LandingOrderForm({
  landingPath,
  title,
  note,
  button,
  products,
}: {
  landingPath: string;
  title: string;
  note: string;
  button: string;
  products: LandingProductPick[];
}) {
  const first = products[0];
  const [lines, setLines] = useState<OrderLine[]>(
    first ? [{ key: "single", slug: first.slug, color: first.colors[0] ?? "Black", qty: 1 }] : [],
  );
  const [slug, setSlug] = useState(first?.slug ?? "");
  const product = products.find((item) => item.slug === slug) ?? first;
  const [color, setColor] = useState(product?.colors[0] ?? "Black");
  const [city, setCity] = useState("Dhaka");
  const [shipping, setShipping] = useState<"inside" | "outside">("inside");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const key = useRef("");
  const startedAt = useRef(0);
  if (!key.current) key.current = crypto.randomUUID();
  if (!startedAt.current) startedAt.current = Date.now();

  const fee = SHIP[shipping];
  const subtotal = lines.reduce((sum, line) => {
    const item = products.find((row) => row.slug === line.slug);
    return sum + money(item?.pricePaisa ?? "0") * BigInt(line.qty);
  }, 0n);
  const pieces = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = subtotal + fee;

  function setLineQty(key: string, qty: number) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, qty } : line)));
  }

  function addOne() {
    if (!product || lines.length >= 8) return;
    setLines((current) => [...current, { key: crypto.randomUUID(), slug: product.slug, color, qty: 1 }]);
  }

  function pickCity(next: string) {
    setCity(next);
    setShipping(next === "Dhaka" ? "inside" : "outside");
  }

  function pickProduct(next: string) {
    const item = products.find((row) => row.slug === next);
    const nextColor = item?.colors[0] ?? "Black";
    setSlug(next);
    setColor(nextColor);
    setLines((current) => {
      const only = current[0];
      if (current.length !== 1 || !only) return current;
      return [{ ...only, slug: next, color: nextColor }];
    });
  }

  function pickColor(next: string) {
    setColor(next);
    setLines((current) => {
      const only = current[0];
      if (current.length !== 1 || !only) return current;
      return [{ ...only, color: next }];
    });
  }

  async function submit(form: FormData) {
    if (!product || lines.length === 0) return;
    setError("");
    const phone = normalizeBdPhone(String(form.get("phone") ?? ""));
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const contact = String(form.get("contact") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    const postal = String(form.get("postal") ?? "").trim();
    const extra = String(form.get("note") ?? "").trim();
    if (!phone) {
      setError("Enter a valid Bangladesh mobile number.");
      return;
    }
    if (!lastName || !address) {
      setError("Fill in name, phone, and address.");
      return;
    }
    setPending(true);
    const result = await placeOrderAction({
      idempotencyKey: key.current,
      contact: contact || phone,
      firstName,
      lastName,
      phone,
      address,
      city,
      postal,
      shipping,
      customerNote: extra,
      landingPage: landingPath,
      company: String(form.get("company") ?? ""),
      startedAt: startedAt.current,
      items: lines.map((line) => ({ slug: line.slug, color: line.color, qty: line.qty })),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrderNumber(result.number);
    const pixel = window as Window & { fbq?: (...args: unknown[]) => void; ttq?: { track: (name: string) => void } };
    pixel.fbq?.("track", "Lead");
    pixel.ttq?.track("SubmitForm");
  }

  if (!product) {
    return (
      <section id="order" className="bg-neutral-50 px-4 py-16 text-center">
        <h2 className="font-display text-3xl">{title}</h2>
        <p className="mt-3 text-sm text-neutral-600">No product is ready to order on this page yet.</p>
      </section>
    );
  }

  if (orderNumber) {
    return (
      <section id="order" className="bg-black px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">Order saved</p>
          <h2 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">Order {orderNumber}</h2>
          <p className="mt-4 text-sm leading-7 text-white/70">
            We will call about {pieces} piece{pieces === 1 ? "" : "s"} to confirm. Pay cash when it arrives.
          </p>
          <p className="mt-5 font-display text-3xl">{formatPaisa(total)}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="scroll-mt-20 bg-neutral-100">
      <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="bg-black p-5 text-white sm:p-8 lg:p-10">
          <p className="text-[11px] tracking-[0.22em] text-white/50 uppercase">Cash on delivery</p>
          <h2 className="font-display mt-3 text-4xl tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/70">{note}</p>
          <ul className="mt-8 grid gap-3">
            {lines.map((line) => {
              const item = products.find((row) => row.slug === line.slug);
              if (!item) return null;
              const price = money(item.pricePaisa);
              const was = money(item.comparePaisa);
              return (
                <li key={line.key} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 border border-white/15 p-2">
                  <img src={item.image} alt="" className="aspect-square w-full object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.name}</p>
                    <p className="mt-0.5 text-xs text-white/55">{line.color}</p>
                    <p className="mt-1 text-sm">
                      {formatPaisa(price)}
                      {was > price ? <span className="ml-2 text-white/40 line-through">{formatPaisa(was)}</span> : null}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="flex items-center gap-2">
                      <button type="button" className="size-7 border border-white/30" aria-label="Less" onClick={() => setLineQty(line.key, Math.max(1, line.qty - 1))}>−</button>
                      <span className="w-4 text-center text-sm">{line.qty}</span>
                      <button type="button" className="size-7 border border-white/30" aria-label="More" onClick={() => setLineQty(line.key, Math.min(5, line.qty + 1))}>+</button>
                    </span>
                    {lines.length > 1 ? (
                      <button type="button" className="text-[11px] text-white/50 underline" onClick={() => setLines((current) => current.filter((row) => row.key !== line.key))}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <form action={(form) => void submit(form)} className="relative bg-white p-5 sm:p-8 lg:p-10">
          <input
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />
          <div className="flex gap-3 overflow-x-auto pb-2">
            {products.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => pickProduct(item.slug)}
                className={`w-28 shrink-0 border text-left ${item.slug === product.slug ? "border-black" : "border-black/10"}`}
              >
                <img src={item.image} alt="" className="aspect-square w-full object-cover" />
                <span className="block truncate px-2 py-2 text-xs">{item.name}</span>
              </button>
            ))}
          </div>

          {product.colors.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pickColor(item)}
                  className={`h-9 border px-3 text-xs ${item === color ? "border-black bg-black text-white" : "border-black/15"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}

          <button type="button" onClick={addOne} className="mt-4 h-11 w-full border border-black text-sm">
            Add one more
          </button>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Email or phone</span>
              <input name="contact" autoComplete="email" placeholder="Optional, if different from the phone" className="h-12 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">First name</span>
              <input name="firstName" autoComplete="given-name" className="h-12 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Last name</span>
              <input name="lastName" required autoComplete="family-name" className="h-12 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Phone</span>
              <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" className="h-12 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Country</span>
              <select disabled className="h-12 w-full border border-neutral-300 bg-white px-3 text-sm">
                <option>Bangladesh</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">District</span>
              <select value={city} onChange={(event) => pickCity(event.target.value)} className="h-12 w-full border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-black">
                {BD_DISTRICTS.map((district) => (
                  <option key={district}>{district}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Postal code</span>
              <input name="postal" autoComplete="postal-code" placeholder="Optional" className="h-12 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Address</span>
              <textarea name="address" required rows={3} className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Note, optional</span>
              <input name="note" placeholder="Colour, size, or a landmark" className="h-12 w-full border border-neutral-300 px-3 text-sm outline-none focus:border-black" />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["inside", "outside"] as const).map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => setShipping(zone)}
                className={`h-14 border px-3 text-left text-sm ${shipping === zone ? "border-black bg-black text-white" : "border-black/15"}`}
              >
                <span className="block text-xs">{zone === "inside" ? "Inside Dhaka" : "Outside Dhaka"}</span>
                <span className="mt-0.5 block font-medium">{formatPaisa(SHIP[zone])}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 border border-black/10">
            <p className="border-b border-black/10 px-3 py-2 text-[11px] tracking-[0.14em] text-neutral-500 uppercase">Payment</p>
            <p className="flex items-center justify-between px-3 py-3 text-sm">
              <span>Cash on delivery</span>
              <span className="text-xs text-neutral-500">We call first</span>
            </p>
            <p className="border-t border-black/10 px-3 py-3 text-sm text-neutral-400">Online pay · bKash / card · soon</p>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal · {pieces}</span>
              <span>{formatPaisa(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Shipping · {shipping === "inside" ? "Inside Dhaka" : "Outside Dhaka"}</span>
              <span>{formatPaisa(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2 text-base font-medium">
              <span>Total</span>
              <span>{formatPaisa(total)}</span>
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 inline-flex h-14 w-full items-center justify-center bg-black text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Placing order…" : `${button} · ${formatPaisa(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-neutral-500">No online payment. We call before packing.</p>
        </form>
      </div>
    </section>
  );
}
