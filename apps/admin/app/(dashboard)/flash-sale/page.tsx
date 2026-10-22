"use client";

import { SHOWCASE_PRODUCTS, type FlashSaleConfig } from "@bismillah/shared";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";

const STORE_API =
  process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type FormState = {
  title: string;
  subtitle: string;
  isActive: boolean;
  durationHours: string;
  discountKind: "fixed" | "percent";
  discountInput: string;
  productSlugs: string[];
};

function toForm(sale: FlashSaleConfig): FormState {
  const discountInput =
    sale.discountKind === "percent"
      ? String(Number(sale.discountValue) / 100)
      : String(Number(sale.discountValue) / 100);

  const end = Date.parse(sale.endsAt);
  const start = Date.parse(sale.startsAt);
  const hoursLeft =
    Number.isFinite(end) && Number.isFinite(start)
      ? Math.max(1, Math.round((end - Date.now()) / (60 * 60 * 1000)))
      : 8;

  return {
    title: sale.title,
    subtitle: sale.subtitle,
    isActive: sale.isActive,
    durationHours: String(Math.min(720, Math.max(1, hoursLeft))),
    discountKind: sale.discountKind,
    discountInput,
    productSlugs: [...sale.productSlugs],
  };
}

export default function FlashSaleAdminPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [previewEndsAt, setPreviewEndsAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${STORE_API}/api/flash-sale`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const sale = (await res.json()) as FlashSaleConfig;
        if (cancelled) return;
        setForm(toForm(sale));
        setPreviewEndsAt(sale.endsAt);
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

  const selectedCount = form?.productSlugs.length ?? 0;

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
      const has = prev.productSlugs.includes(slug);
      return {
        ...prev,
        productSlugs: has
          ? prev.productSlugs.filter((s) => s !== slug)
          : [...prev.productSlugs, slug],
      };
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setStatus("saving");
    setMessage("");

    const hours = Number(form.durationHours);
    const amount = Number(form.discountInput);
    if (!Number.isFinite(hours) || hours <= 0) {
      setStatus("error");
      setMessage("Duration must be a positive number of hours.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus("error");
      setMessage("Discount must be a positive number.");
      return;
    }
    if (form.productSlugs.length === 0) {
      setStatus("error");
      setMessage("Select at least one product.");
      return;
    }

    const discountValue =
      form.discountKind === "percent"
        ? String(Math.round(amount * 100))
        : String(Math.round(amount * 100));

    try {
      const res = await fetch(`${STORE_API}/api/flash-sale`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          isActive: form.isActive,
          durationHours: hours,
          discountKind: form.discountKind,
          discountValue,
          productSlugs: form.productSlugs,
        }),
      });
      const data = (await res.json()) as FlashSaleConfig & { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(toForm(data));
      setPreviewEndsAt(data.endsAt);
      setStatus("saved");
      setMessage("Flash sale saved. Storefront countdown updated.");
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
        description="Set duration and discount. Storefront shows a live countdown with sale prices."
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

        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Duration (hours from now)
          </span>
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={form.durationHours}
            onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
            className="admin-field"
            required
          />
          <span className="text-xs text-muted-foreground">
            Saving restarts the countdown from now.
            {previewEndsAt ? ` Current end: ${new Date(previewEndsAt).toLocaleString()}` : null}
          </span>
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
            Products ({selectedCount})
          </legend>
          <ul className="admin-panel max-h-72 overflow-y-auto">
            {SHOWCASE_PRODUCTS.map((product) => {
              const checked = form.productSlugs.includes(product.slug);
              return (
                <li key={product.slug} className="border-b border-border last:border-b-0">
                  <label className="flex cursor-pointer items-center gap-3 px-3.5 py-3 text-sm transition hover:bg-secondary/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSlug(product.slug)}
                      className="size-4 accent-primary"
                    />
                    <span className="flex-1">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </label>
                </li>
              );
            })}
          </ul>
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
