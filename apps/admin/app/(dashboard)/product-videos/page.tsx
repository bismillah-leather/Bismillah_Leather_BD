"use client";

import { SHOWCASE_PRODUCTS, isSupportedVideoUrl } from "@bismillah/shared";
import { Button, Input } from "@bismillah/ui";
import { useEffect, useMemo, useState } from "react";

const STORE_API =
  process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") || "http://localhost:3000";

type VideoMap = Record<string, string>;

export default function ProductVideosPage() {
  const [map, setMap] = useState<VideoMap>({});
  const [draft, setDraft] = useState<VideoMap>({});
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "saved" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${STORE_API}/api/product-videos`, { cache: "no-store" });
        const data = (await res.json()) as VideoMap;
        if (cancelled) return;
        setMap(data);
        setDraft(data);
        setStatus("idle");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setError("Could not load product videos from the storefront API.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const products = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SHOWCASE_PRODUCTS;
    return SHOWCASE_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [filter]);

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
      const res = await fetch(`${STORE_API}/api/product-videos`, {
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
      <h1 className="font-display text-4xl">Product videos</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Paste a YouTube or Facebook video / live / reel URL. Products with a link show a film
        section on the details page.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, SKU…"
          className="max-w-xs"
        />
        <Button type="button" onClick={save} disabled={status === "saving" || status === "loading"}>
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save videos"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {products.map((product) => {
          const value = draft[product.slug] ?? "";
          const live = map[product.slug];
          return (
            <li key={product.slug} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start sm:gap-4">
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.sku}
                  {live ? " · live" : ""}
                </p>
              </div>
              <Input
                value={value}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    [product.slug]: e.target.value,
                  }))
                }
                placeholder="https://youtube.com/… or facebook.com/…/videos/…"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
