"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewCreateForm({
  products,
}: {
  products: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [authorCity, setAuthorCity] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publish, setPublish] = useState(true);
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/admin/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          authorName,
          authorCity,
          title,
          body,
          publish,
          verified,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; status?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add review.");
        return;
      }
      setMsg(data.status === "approved" ? "Review published." : "Review saved as pending.");
      setAuthorName("");
      setAuthorCity("");
      setTitle("");
      setBody("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel grid gap-4 p-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm sm:col-span-2">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Product</span>
        <select
          required
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="admin-field"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Name</span>
        <input required value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">City</span>
        <input value={authorCity} onChange={(e) => setAuthorCity(e.target.value)} className="admin-field" placeholder="Dhaka" />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Stars</span>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="admin-field">
          {[5, 4, 3, 2, 1].map((star) => (
            <option key={star} value={star}>
              {star} star{star === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="admin-field" />
      </label>
      <label className="grid gap-2 text-sm sm:col-span-2">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Review</span>
        <textarea
          required
          minLength={12}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="admin-field h-auto min-h-[7rem] py-2.5"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        Publish now (skip pending)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
        Mark as verified purchase
      </label>
      {error ? <p className="text-sm text-[#f0b2a6] sm:col-span-2">{error}</p> : null}
      {msg ? <p className="text-sm text-primary sm:col-span-2">{msg}</p> : null}
      <button type="submit" disabled={pending || !productId} className="admin-btn-primary h-11 px-5 text-[11px] sm:col-span-2">
        {pending ? "Saving…" : "Add review"}
      </button>
    </form>
  );
}
