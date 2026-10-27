"use client";

import { SHOWCASE_PRODUCTS, type FlashSaleConfig, type FlashSaleItem } from "@bismillah/shared";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";

type ProductOption = { name: string; slug: string; sku: string };

const STORE_API =
  process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type SelectedProduct = {
  slug: string;
  durationHours: string;
};

type FormState = {
  title: string;
  subtitle: string;
  isActive: boolean;
  discountKind: "fixed" | "percent";
  discountInput: string;
  products: SelectedProduct[];
};

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

  const items = sale.items?.length
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
    })),
  };
}

export default function FlashSaleAdminPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [catalog, setCatalog] = useState<ProductOption[]>(() =>
    SHOWCASE_PRODUCTS.map((p) => ({ name: p.name, slug: p.slug, sku: p.sku })),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [saleRes, productsRes] = await Promise.all([
          fetch(`${STORE_API}/api/flash-sale`, { cache: "no-store" }),
          fetch("/admin/api/products", { cache: "no-store" }),
        ]);
        if (!saleRes.ok) throw new Error("Failed to load");
        const sale = (await saleRes.json()) as FlashSaleConfig;
        if (productsRes.ok) {
          const data = (await productsRes.json()) as { products?: ProductOption[] };
          if (data.products?.length) setCatalog(data.products);
        }
        if (cancelled) return;
        setForm(toForm(sale));
        setStatus("idle");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          `Could not reach store API at ${STORE_API}. Start the web app on port 3000.`,
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
      return "Example: 15 = 15% off every flash item.";
    }
    return "Example: 200 = ৳200 off each flash item.";
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
        products: [...prev.products, { slug, durationHours: String(8 + nextIndex * 2) }],
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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setStatus("saving");
    setMessage("");

    const amount = Number(form.discountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus("error");
      setMessage("Discount must be a positive number.");
      return;
    }
    if (form.products.length === 0) {
      setStatus("error");
      setMessage("Select at least one product.");
      return;
    }

    for (const product of form.products) {
      const hours = Number(product.durationHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        setStatus("error");
        setMessage("Set a valid duration (hours) for each selected product.");
        return;
      }
    }

    const discountValue = String(Math.round(amount * 100));

    try {
      const res = await fetch(`${STORE_API}/api/flash-sale`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          isActive: form.isActive,
          discountKind: form.discountKind,
          discountValue,
          items: form.products.map((product) => ({
            slug: product.slug,
            durationHours: Number(product.durationHours),
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
        description="Pick products and set a separate countdown for each. Flash Sale stays its own section."
      />

      <form onSubmit={onSave} className="mt-8 grid max-w-2xl gap-6">
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
            Discount type
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
            step={1}
            value={form.discountInput}
            onChange={(e) => setForm({ ...form, discountInput: e.target.value })}
            className="admin-field"
            required
          />
          <span className="text-xs text-muted-foreground">{discountHint}</span>
        </label>

        <fieldset className="grid gap-3">
          <legend className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Products · separate timers ({selectedCount})
          </legend>
          <ul className="admin-panel max-h-[28rem] overflow-y-auto">
            {catalog.map((product) => {
              const selected = form.products.find((p) => p.slug === product.slug);
              return (
                <li key={product.slug} className="border-b border-border last:border-b-0">
                  <div className="flex flex-wrap items-center gap-3 px-3.5 py-3 text-sm transition hover:bg-secondary/60">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(selected)}
                        onChange={() => toggleSlug(product.slug)}
                        className="size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1 truncate">{product.name}</span>
                      <span className="text-xs text-muted-foreground">{product.sku}</span>
                    </label>
                    {selected ? (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tracking-wide uppercase">Hours</span>
                        <input
                          type="number"
                          min={0.25}
                          step={0.25}
                          value={selected.durationHours}
                          onChange={(e) => setProductHours(product.slug, e.target.value)}
                          className="admin-field h-9 w-20 px-2"
                          required
                        />
                      </label>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Saving restarts each product countdown from now for its own hours.
          </p>
        </fieldset>

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
