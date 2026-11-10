"use client";

import {
  formatPaisa,
  percentOff,
  SHOWCASE_PRODUCTS,
  type FlashSaleConfig,
  type FlashSaleItem,
} from "@bismillah/shared";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";

type ProductOption = { name: string; slug: string; sku: string; pricePaisa: string };

type SelectedProduct = {
  slug: string;
  durationHours: string;
  amountOffTaka: string;
  offerTaka: string;
};

type FormState = {
  title: string;
  subtitle: string;
  isActive: boolean;
  discountKind: "fixed" | "percent";
  discountInput: string;
  products: SelectedProduct[];
};

function paisaToTakaInput(paisa?: string) {
  if (!paisa || !/^\d+$/.test(paisa)) return "";
  const taka = Number(paisa) / 100;
  return Number.isInteger(taka) ? String(taka) : taka.toFixed(2);
}

function offerFromTaka(listPaisa: string, taka: string) {
  const list = BigInt(listPaisa || "0");
  const amount = Number(taka);
  if (!Number.isFinite(amount) || amount <= 0) return list;
  const next = BigInt(Math.round(amount * 100));
  return next > 0n && next < list ? next : list;
}

function offerPrice(listPaisa: string, kind: "fixed" | "percent", input: string) {
  const list = BigInt(listPaisa || "0");
  const amount = Number(input);
  if (!Number.isFinite(amount) || amount <= 0 || list <= 0n) return list;
  if (kind === "percent") {
    const points = BigInt(Math.round(Math.min(100, amount) * 100));
    return list - percentOff(list, points);
  }
  const off = BigInt(Math.round(amount * 100));
  return list > off ? list - off : 0n;
}

function priceAfterAmount(listPaisa: string, amountTaka: string) {
  const list = BigInt(listPaisa || "0");
  const amount = Number(amountTaka);
  if (!Number.isFinite(amount) || amount <= 0 || list <= 0n) return list;
  const off = BigInt(Math.round(amount * 100));
  return off > 0n && off < list ? list - off : list;
}

function hoursFromItem(item: FlashSaleItem): string {
  const end = Date.parse(item.endsAt);
  const hoursLeft = Number.isFinite(end)
    ? Math.max(1, Math.round((end - Date.now()) / (60 * 60 * 1000)))
    : 8;
  return String(Math.min(720, Math.max(1, hoursLeft)));
}

function toForm(sale: FlashSaleConfig): FormState {
  const discountInput =
    sale.discountKind === "percent"
      ? String(Number(sale.discountValue) / 100)
      : String(Number(sale.discountValue) / 100);

  const items: FlashSaleItem[] = sale.items?.length
    ? sale.items
    : sale.productSlugs.map((slug) => ({
        slug,
        startsAt: sale.startsAt,
        endsAt: sale.endsAt,
      }));

  return {
    title: sale.title,
    subtitle: sale.subtitle,
    isActive: sale.isActive,
    discountKind: sale.discountKind,
    discountInput,
    products: items.map((item) => ({
      slug: item.slug,
      durationHours: hoursFromItem(item),
      amountOffTaka: paisaToTakaInput(item.amountOffPaisa),
      offerTaka: paisaToTakaInput(item.offerPaisa),
    })),
  };
}

export default function FlashSaleAdminPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [catalog, setCatalog] = useState<ProductOption[]>(() =>
    SHOWCASE_PRODUCTS.map((p) => ({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      pricePaisa: p.pricePaisa.toString(),
    })),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [bulk, setBulk] = useState({ amountOffTaka: "", offerTaka: "", durationHours: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saleRes, productsRes] = await Promise.all([
          fetch("/admin/api/flash-sale", { cache: "no-store" }),
          fetch("/admin/api/products", { cache: "no-store" }),
        ]);
        if (!saleRes.ok) throw new Error("Failed to load");
        const sale = (await saleRes.json()) as FlashSaleConfig;
        if (productsRes.ok) {
          const data = (await productsRes.json()) as { products?: ProductOption[] };
          if (data.products?.length) {
            setCatalog(
              data.products.map((product) => ({
                ...product,
                pricePaisa: product.pricePaisa || "0",
              })),
            );
          }
        }
        if (cancelled) return;
        setForm(toForm(sale));
        setStatus("idle");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          "Could not load the flash sale. Refresh and try again.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCount = form?.products.length ?? 0;

  const discountHint = useMemo(() => {
    if (!form) return "";
    if (form.discountKind === "percent") {
      return "Fallback only. A product's own amount or offer price replaces this.";
    }
    return "Fallback only. Example: 30 cuts ৳30 off any product that has no own price.";
  }, [form]);

  function toggleSlug(slug: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const existing = prev.products.find((p) => p.slug === slug);
      if (existing) {
        return {
          ...prev,
          products: prev.products.filter((p) => p.slug !== slug),
        };
      }
      const nextIndex = prev.products.length;
      return {
        ...prev,
        products: [
          ...prev.products,
          {
            slug,
            durationHours: String(8 + nextIndex * 2),
            amountOffTaka: "",
            offerTaka: "",
          },
        ],
      };
    });
  }

  function setProductAmount(slug: string, amountOffTaka: string) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) => (p.slug === slug ? { ...p, amountOffTaka } : p)),
      };
    });
  }

  function setProductOffer(slug: string, offerTaka: string) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) => (p.slug === slug ? { ...p, offerTaka } : p)),
      };
    });
  }

  function setProductHours(slug: string, durationHours: string) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: prev.products.map((p) => (p.slug === slug ? { ...p, durationHours } : p)),
      };
    });
  }

  function applyBulk() {
    const amountOffTaka = bulk.amountOffTaka.trim();
    const offerTaka = bulk.offerTaka.trim();
    const durationHours = bulk.durationHours.trim();
    if (!form || form.products.length === 0) {
      setStatus("error");
      setMessage("Add products to the sale before applying in bulk.");
      return;
    }
    if (!amountOffTaka && !offerTaka && !durationHours) {
      setStatus("error");
      setMessage("Fill an amount, an offer price, or hours before applying in bulk.");
      return;
    }
    setForm((prev) => {
      if (!prev || prev.products.length === 0) return prev;
      return {
        ...prev,
        products: prev.products.map((product) => ({
          ...product,
          ...(amountOffTaka ? { amountOffTaka } : {}),
          ...(offerTaka ? { offerTaka } : {}),
          ...(durationHours ? { durationHours } : {}),
        })),
      };
    });
    setStatus("idle");
    setMessage(`Applied to ${selectedCount} product${selectedCount === 1 ? "" : "s"}. Save to publish.`);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setStatus("saving");
    setMessage("");

    if (form.products.length === 0) {
      setStatus("error");
      setMessage("Select at least one product.");
      return;
    }

    const globalAmount = form.discountInput.trim() ? Number(form.discountInput) : null;
    const everyProductHasOwnPrice = form.products.every(
      (product) => product.offerTaka.trim() || product.amountOffTaka.trim(),
    );
    if (globalAmount == null && !everyProductHasOwnPrice) {
      setStatus("error");
      setMessage("Set a fallback discount, or give every product its own amount or offer price.");
      return;
    }
    if (globalAmount != null && (!Number.isFinite(globalAmount) || globalAmount <= 0)) {
      setStatus("error");
      setMessage("Fallback discount must be a positive number.");
      return;
    }

    for (const product of form.products) {
      const hours = Number(product.durationHours);
      const catalogProduct = catalog.find((item) => item.slug === product.slug);
      const name = catalogProduct?.name ?? product.slug;
      const listTaka = Number(catalogProduct?.pricePaisa || "0") / 100;
      const offer = product.offerTaka.trim() ? Number(product.offerTaka) : null;
      const amountOff = product.amountOffTaka.trim() ? Number(product.amountOffTaka) : null;
      if (!Number.isFinite(hours) || hours <= 0) {
        setStatus("error");
        setMessage(`${name}: set a valid timer in hours.`);
        return;
      }
      if (offer != null && (!Number.isFinite(offer) || offer <= 0)) {
        setStatus("error");
        setMessage(`${name}: offer price must be a positive amount.`);
        return;
      }
      if (amountOff != null && (!Number.isFinite(amountOff) || amountOff <= 0)) {
        setStatus("error");
        setMessage(`${name}: amount off must be a positive amount.`);
        return;
      }
      if (listTaka > 0 && offer != null && offer >= listTaka) {
        setStatus("error");
        setMessage(`${name}: offer price must be lower than the regular price.`);
        return;
      }
      if (listTaka > 0 && amountOff != null && amountOff >= listTaka) {
        setStatus("error");
        setMessage(`${name}: amount off must be lower than the regular price.`);
        return;
      }
    }

    try {
      const res = await fetch("/admin/api/flash-sale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          isActive: form.isActive,
          ...(globalAmount != null
            ? {
                discountKind: form.discountKind,
                discountValue: String(Math.round(globalAmount * 100)),
              }
            : {}),
          items: form.products.map((product) => ({
            slug: product.slug,
            durationHours: Number(product.durationHours),
            ...(product.amountOffTaka.trim()
              ? { amountOffTaka: Number(product.amountOffTaka) }
              : {}),
            ...(product.offerTaka.trim() ? { offerTaka: Number(product.offerTaka) } : {}),
          })),
        }),
      });
      const data = (await res.json()) as FlashSaleConfig & { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(toForm(data));
      setStatus("saved");
      setMessage("Flash sale saved. Each product has its own countdown.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (status === "loading" || !form) {
    return (
      <div>
        <AdminPageHeader eyebrow="Merchandising" title="Flash Sale" />
        <p className="mt-6 text-sm text-muted-foreground">
          {status === "error" ? message : "Loading current sale…"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Merchandising"
        title="Flash Sale"
        description="Each product has its own amount off, offer price, and timer. Apply one price to every product when you want them the same."
      />

      <form onSubmit={onSave} className="mt-8 grid max-w-3xl gap-6">
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Title
          </span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="admin-field"
            required
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Subtitle
          </span>
          <input
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="admin-field"
          />
        </label>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="size-4 accent-primary"
          />
          <span>Active on storefront</span>
        </label>

        <fieldset className="grid gap-3">
          <legend className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Fallback discount
          </legend>
          <div className="admin-segment">
            {(
              [
                ["fixed", "Taka off"],
                ["percent", "Percent off"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                data-active={form.discountKind === value}
                onClick={() => setForm({ ...form, discountKind: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {form.discountKind === "percent" ? "Percent (%)" : "Amount (৳)"}
          </span>
          <input
            type="number"
            min={1}
            max={form.discountKind === "percent" ? 100 : undefined}
            step={1}
            value={form.discountInput}
            onChange={(e) => setForm({ ...form, discountInput: e.target.value })}
            className="admin-field"
          />
          <span className="text-xs text-muted-foreground">{discountHint}</span>
        </label>

        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              On this sale
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">{selectedCount}</span>
          </div>
          <div className="admin-panel grid gap-3 px-4 py-4">
            <div>
              <p className="text-[11px] tracking-[0.16em] text-[#e4c98a] uppercase">Bulk</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Copies into every product below. Leave a box empty to keep that product’s own value.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_7.5rem_auto] sm:items-end">
              <label className="grid gap-1.5">
                <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  Amount off (৳)
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={bulk.amountOffTaka}
                  onChange={(e) => setBulk({ ...bulk, amountOffTaka: e.target.value })}
                  placeholder="250"
                  className="admin-field h-10"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  Offer price (৳)
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={bulk.offerTaka}
                  onChange={(e) => setBulk({ ...bulk, offerTaka: e.target.value })}
                  placeholder="1200"
                  className="admin-field h-10"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                  Hours
                </span>
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={bulk.durationHours}
                  onChange={(e) => setBulk({ ...bulk, durationHours: e.target.value })}
                  placeholder="8"
                  className="admin-field h-10"
                />
              </label>
              <button type="button" onClick={applyBulk} className="admin-btn-primary h-10 px-4 text-xs">
                Apply to all
              </button>
            </div>
          </div>
          {form.products.length === 0 ? (
            <p className="admin-panel px-4 py-6 text-sm text-muted-foreground">
              Nothing on the sale yet. Add a product from the catalog.
            </p>
          ) : (
            <ul className="grid gap-3">
              {form.products.map((selected) => {
                const product = catalog.find((item) => item.slug === selected.slug);
                const name = product?.name ?? selected.slug;
                const sku = product?.sku ?? "";
                const listPaisa = product?.pricePaisa ?? "0";
                const nextPaisa = selected.offerTaka.trim()
                  ? offerFromTaka(listPaisa, selected.offerTaka)
                  : selected.amountOffTaka.trim()
                    ? priceAfterAmount(listPaisa, selected.amountOffTaka)
                    : offerPrice(listPaisa, form.discountKind, form.discountInput);
                return (
                  <li key={selected.slug} className="admin-panel overflow-hidden">
                    <div className="flex items-center gap-4 border-b border-border px-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{name}</p>
                        {sku ? (
                          <p className="mt-0.5 truncate text-[11px] tracking-wide text-muted-foreground">
                            {sku}
                          </p>
                        ) : null}
                      </div>
                      <PricePair listPaisa={listPaisa} nextPaisa={nextPaisa} active />
                      <button
                        type="button"
                        onClick={() => toggleSlug(selected.slug)}
                        className="admin-btn-ghost h-8 shrink-0 px-3 text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 px-4 py-3.5 sm:grid-cols-3">
                      <label className="grid gap-1.5">
                        <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                          Amount off (৳)
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={selected.amountOffTaka}
                          onChange={(e) => setProductAmount(selected.slug, e.target.value)}
                          placeholder="Own cut"
                          className="admin-field h-10"
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                          Offer price (৳)
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={selected.offerTaka}
                          onChange={(e) => setProductOffer(selected.slug, e.target.value)}
                          placeholder="Final price"
                          className="admin-field h-10"
                        />
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                          Timer (hours)
                        </span>
                        <input
                          type="number"
                          min={0.25}
                          step={0.25}
                          value={selected.durationHours}
                          onChange={(e) => setProductHours(selected.slug, e.target.value)}
                          className="admin-field h-10"
                          required
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Offer price wins when both are filled. Empty boxes use the fallback discount. Saving restarts each timer from now.
          </p>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Catalog</h2>
          <ul className="admin-panel max-h-80 divide-y divide-border overflow-y-auto">
            {catalog
              .filter((product) => !form.products.some((item) => item.slug === product.slug))
              .map((product) => (
                <li key={product.slug} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{product.name}</p>
                    <p className="truncate text-[11px] tracking-wide text-muted-foreground">{product.sku}</p>
                  </div>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatPaisa(BigInt(product.pricePaisa || "0"))}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSlug(product.slug)}
                    className="admin-btn-ghost h-8 shrink-0 px-3 text-[11px]"
                  >
                    Add
                  </button>
                </li>
              ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={status === "saving"} className="admin-btn-primary">
            {status === "saving" ? "Saving…" : "Save flash sale"}
          </button>
          {message ? (
            <p
              className={`text-sm ${
                status === "error" ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function PricePair({
  listPaisa,
  nextPaisa,
  active,
}: {
  listPaisa: string;
  nextPaisa: bigint;
  active: boolean;
}) {
  const list = BigInt(listPaisa || "0");
  if (list <= 0n) return null;
  const dropped = active && nextPaisa < list;
  return (
    <span className="shrink-0 text-right text-xs whitespace-nowrap tabular-nums">
      {dropped ? (
        <>
          <span className="mr-2 text-muted-foreground line-through">{formatPaisa(list)}</span>
          <span className="text-[#e4c98a]">{formatPaisa(nextPaisa)}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{formatPaisa(list)}</span>
      )}
    </span>
  );
}
