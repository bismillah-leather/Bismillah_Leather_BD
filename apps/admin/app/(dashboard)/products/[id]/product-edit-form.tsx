"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CategoryOption = { id: string; name: string };

export function ProductEditForm({
  product,
  categories,
}: {
  product: {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    sku: string;
    priceTaka: string;
    salePriceTaka: string;
    stock: number;
    isFeatured: boolean;
  };
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [sku, setSku] = useState(product.sku);
  const [priceTaka, setPriceTaka] = useState(product.priceTaka);
  const [salePriceTaka, setSalePriceTaka] = useState(product.salePriceTaka);
  const [stock, setStock] = useState(String(product.stock));
  const [featured, setFeatured] = useState(product.isFeatured);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

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
          description,
          categoryId,
          sku,
          isFeatured: featured,
          priceTaka: Number(priceTaka),
          salePriceTaka: salePriceTaka.trim() === "" ? null : Number(salePriceTaka),
          stock: Number(stock),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not save.");
        return;
      }
      setMessage("Saved");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="admin-field h-auto min-h-24 py-2.5"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Category
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="admin-field"
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">SKU</span>
          <input value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} className="admin-field" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Price (৳)
          </span>
          <input
            type="number"
            min={1}
            value={priceTaka}
            onChange={(e) => setPriceTaka(e.target.value)}
            className="admin-field"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Sale (৳)
          </span>
          <input
            type="number"
            min={1}
            value={salePriceTaka}
            onChange={(e) => setSalePriceTaka(e.target.value)}
            placeholder="Optional"
            className="admin-field"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
            Stock (on product page)
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="admin-field"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="size-4 accent-primary"
          />
          Featured
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
