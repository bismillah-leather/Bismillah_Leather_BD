"use client";

import { formatPaisa, parseTakaToPaisa } from "@bismillah/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductDeleteButton } from "./product-delete-button";

export type ShelfProduct = {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  categoryName: string;
  image: string | null;
  sku: string | null;
  priceTaka: string;
  salePriceTaka: string;
  stock: number;
};

const STATUSES = ["draft", "scheduled", "published", "archived"] as const;

function PricePreview({ regular, sale }: { regular: string; sale: string }) {
  if (!sale.trim()) return null;
  try {
    const list = parseTakaToPaisa(regular);
    const next = parseTakaToPaisa(sale);
    if (next <= 0n || next >= list) {
      return (
        <p className="text-[11px] text-[#f0b2a6]">Sale price must be lower than the regular price.</p>
      );
    }
    return (
      <p className="text-xs tabular-nums">
        <span className="mr-2 text-muted-foreground line-through">{formatPaisa(list)}</span>
        <span className="text-[#e4c98a]">{formatPaisa(next)}</span>
      </p>
    );
  } catch {
    return null;
  }
}

export function ProductShelfCard({ product }: { product: ShelfProduct }) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [priceTaka, setPriceTaka] = useState(product.priceTaka);
  const [salePriceTaka, setSalePriceTaka] = useState(product.salePriceTaka);
  const [stock, setStock] = useState(String(product.stock));
  const [status, setStatus] = useState(product.status);
  const [featured, setFeatured] = useState(product.isFeatured);
  const [image, setImage] = useState(product.image);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setImage(product.image);
  }, [product.image]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const res = await fetch(`/admin/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          isFeatured: featured,
          priceTaka: Number(priceTaka),
          salePriceTaka: salePriceTaka.trim() === "" ? null : Number(salePriceTaka),
          stock: Number(stock),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const statusRes = await fetch(`/admin/api/products/${product.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok || !statusRes.ok) {
        setMessage(data.error ?? "Could not save.");
        return;
      }
      setMessage("Saved");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(`/admin/api/products/${product.id}/image`, {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setMessage(data.error ?? "Photo was not saved.");
        return;
      }
      setImage(data.url);
      setMessage("Photo saved on R2");
      router.refresh();
    } catch {
      setMessage("Network error.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={save} className="admin-panel overflow-hidden">
      <div className="grid gap-3 p-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#1c1814]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center px-2 text-center text-[10px] tracking-wide text-muted-foreground uppercase">
              No photo
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-field h-10 text-sm"
            required
          />
          <p className="truncate text-[11px] text-muted-foreground">
            {product.categoryName} · /{product.slug}
            {product.sku ? ` · ${product.sku}` : ""}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1 text-[11px] text-muted-foreground">
              Price (৳)
              <input
                type="number"
                min={1}
                value={priceTaka}
                onChange={(e) => setPriceTaka(e.target.value)}
                className="admin-field h-9"
              />
            </label>
            <label className="grid gap-1 text-[11px] text-muted-foreground">
              Sale (৳)
              <input
                type="number"
                min={1}
                value={salePriceTaka}
                onChange={(e) => setSalePriceTaka(e.target.value)}
                placeholder="Optional"
                className="admin-field h-9"
              />
            </label>
            <label className="grid gap-1 text-[11px] text-muted-foreground">
              Stock
              <input
                type="number"
                min={0}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="admin-field h-9"
              />
            </label>
          </div>
          <PricePreview regular={priceTaka} sale={salePriceTaka} />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="admin-field h-9 w-auto text-xs"
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Featured
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="admin-btn-ghost h-9 cursor-pointer px-3 text-[11px]">
              {uploading ? "Uploading…" : "Photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void onPhoto(file);
                }}
              />
            </label>
            <button type="submit" disabled={pending} className="admin-btn-primary h-9 px-3 text-[11px]">
              {pending ? "Saving…" : "Save edit"}
            </button>
            <ProductDeleteButton productId={product.id} productName={name || product.name} />
            <a href={`/admin/products/${product.id}`} className="admin-btn-ghost h-9 px-3 text-[11px]">
              Details
            </a>
            {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
          </div>
        </div>
      </div>
    </form>
  );
}
