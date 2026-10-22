"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PageCreateForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/admin/api/content/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create.");
        return;
      }
      setSlug("");
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
    <form onSubmit={onSubmit} className="admin-panel grid gap-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Slug
          </span>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="shipping-policy"
            className="admin-field"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Title
          </span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shipping policy"
            className="admin-field"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Body
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="admin-field h-auto min-h-24 py-2.5"
          placeholder="Page content…"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Creating…" : "Create page"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </form>
  );
}
