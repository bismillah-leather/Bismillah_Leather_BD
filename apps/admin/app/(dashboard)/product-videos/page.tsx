"use client";

import { SHOWCASE_PRODUCTS, isSupportedVideoUrl } from "@bismillah/shared";
import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";

type VideoMap = Record<string, string>;
type ProductOption = { name: string; slug: string; sku: string; image: string };

export default function ProductVideosPage() {
  const [map, setMap] = useState<VideoMap>({});
  const [draft, setDraft] = useState<VideoMap>({});
  const [catalog, setCatalog] = useState<ProductOption[]>(() =>
    SHOWCASE_PRODUCTS.map((p) => ({ name: p.name, slug: p.slug, sku: p.sku, image: p.image })),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [videosRes, productsRes] = await Promise.all([
          fetch("/admin/api/product-videos", { cache: "no-store" }),
          fetch("/admin/api/products", { cache: "no-store" }),
        ]);
        const data = (await videosRes.json()) as VideoMap;
        if (!videosRes.ok) throw new Error("videos");
        if (productsRes.ok) {
          const list = (await productsRes.json()) as { products?: ProductOption[] };
          if (list.products?.length) setCatalog(list.products);
        }
        if (cancelled) return;
        setMap(data);
        setDraft(data);
        setStatus("idle");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Could not load product videos.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [filter, catalog]);

  async function save() {
    setStatus("saving");
    setError(null);
    const cleaned: VideoMap = {};
    for (const [slug, url] of Object.entries(draft)) {
      const trimmed = url.trim();
      if (!trimmed) continue;
      if (!isSupportedVideoUrl(trimmed)) {
        setStatus("error");
        setError(`Invalid link for ${slug}. Use YouTube or Facebook video / live / reel.`);
        return;
      }
      cleaned[slug] = trimmed;
    }
    try {
      const res = await fetch("/admin/api/product-videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleaned),
      });
      const data = (await res.json().catch(() => ({}))) as VideoMap & { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Save failed");
        return;
      }
      setMap(data);
      setDraft(data);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
      setError("Network error while saving.");
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Product videos"
        description="Paste a YouTube or Facebook video / live / reel URL. Linked products show a film block on PDP."
        action={
          <button
            type="button"
            onClick={save}
            disabled={status === "saving" || status === "loading"}
            className="admin-btn-primary"
          >
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save videos"}
          </button>
        }
      />

      <div className="mt-6">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, SKU…"
          className="admin-field max-w-xs"
        />
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ul className="admin-panel mt-8 divide-y divide-border">
        {products.map((product) => {
          const value = draft[product.slug] ?? "";
          const live = map[product.slug];
          return (
            <li
              key={product.slug}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden border border-black/10 bg-neutral-100">
                  {product.image ? (
                    <img src={product.image} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-neutral-400">No photo</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.sku}
                    {live ? " · live" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={value}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      [product.slug]: e.target.value,
                    }))
                  }
                  placeholder="https://youtube.com/… or facebook.com/…/videos/…"
                  className="admin-field min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      [product.slug]: "",
                    }))
                  }
                  className="admin-btn-danger h-9 px-3 text-[11px]"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
