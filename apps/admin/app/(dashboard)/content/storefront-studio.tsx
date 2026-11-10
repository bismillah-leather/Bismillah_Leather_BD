"use client";

import type { FeaturedCard, HeroSlide, PolicySlug, StorefrontDraft, TrustItem } from "@bismillah/shared";
import { storefrontOriginFrom } from "@bismillah/shared";
import { useEffect, useState } from "react";

const POLICY_FIELDS: { slug: PolicySlug; label: string }[] = [
  { slug: "shipping", label: "Shipping" },
  { slug: "returns", label: "Returns" },
  { slug: "privacy", label: "Privacy" },
];

function previewSrc(src: string, origin: string) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return origin ? `${origin}${src}` : src;
  return "";
}

function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    const configured = process.env.NEXT_PUBLIC_STORE_URL?.replace(/\/$/, "") ?? "";
    setOrigin(storefrontOriginFrom(configured || window.location.origin));
  }, []);
  const preview = previewSrc(value, origin);

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/admin/api/content/image", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <div className="flex items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden bg-neutral-900">
          {preview ? <img src={preview} alt="" className="size-full object-cover" /> : null}
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/catalog/hero-leather.jpg"
            className="admin-field h-10"
          />
          <label className="admin-btn-ghost h-8 w-fit cursor-pointer px-3 text-[11px]">
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void onFile(file);
              }}
            />
          </label>
        </div>
      </div>
      {error ? <p className="text-xs text-[#f0b2a6]">{error}</p> : null}
    </div>
  );
}

export function StorefrontStudio({ initial }: { initial: StorefrontDraft }) {
  const [draft, setDraft] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function setHero(index: number, patch: Partial<HeroSlide>) {
    setDraft((prev) => ({
      ...prev,
      hero: prev.hero.map((slide, i) => (i === index ? { ...slide, ...patch } : slide)),
    }));
  }

  function moveHero(index: number, direction: -1 | 1) {
    setDraft((prev) => {
      const next = [...prev.hero];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const current = next[index];
      const swap = next[target];
      if (!current || !swap) return prev;
      next[index] = swap;
      next[target] = current;
      return { ...prev, hero: next };
    });
  }

  function setFeatured(index: number, patch: Partial<FeaturedCard>) {
    setDraft((prev) => ({
      ...prev,
      featured: prev.featured.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function setTrust(index: number, patch: Partial<TrustItem>) {
    setDraft((prev) => ({
      ...prev,
      trust: prev.trust.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/admin/api/content/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setMessage("Saved. The storefront picks this up on the next load.");
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSave} className="mt-8 grid max-w-5xl gap-6">
      <p className="text-sm text-muted-foreground">
        Store name, phone, and address stay in Settings. Everything below is the homepage and the public pages.
      </p>

      <section className="admin-panel grid gap-4 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[11px] tracking-[0.18em] text-[#e4c98a] uppercase">Hero</h2>
            <p className="mt-1 text-xs text-muted-foreground">The full-width images at the top of the home page.</p>
          </div>
          <button
            type="button"
            className="admin-btn-ghost h-8 px-3 text-[11px]"
            onClick={() =>
              setDraft((prev) =>
                prev.hero.length >= 8
                  ? prev
                  : { ...prev, hero: [...prev.hero, { src: "/catalog/hero-leather.jpg", alt: "New slide" }] },
              )
            }
          >
            Add slide
          </button>
        </div>
        <ul className="grid gap-3">
          {draft.hero.map((slide, index) => (
            <li key={`hero-${index}`} className="grid gap-3 border border-border p-3 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-3">
                <ImageField label={`Slide ${index + 1}`} value={slide.src} onChange={(src) => setHero(index, { src })} />
                <label className="grid gap-1.5">
                  <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Alt text</span>
                  <input
                    value={slide.alt}
                    onChange={(e) => setHero(index, { alt: e.target.value })}
                    className="admin-field h-10"
                  />
                </label>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <button type="button" className="admin-btn-ghost h-8 px-3 text-[11px]" onClick={() => moveHero(index, -1)}>
                  Up
                </button>
                <button type="button" className="admin-btn-ghost h-8 px-3 text-[11px]" onClick={() => moveHero(index, 1)}>
                  Down
                </button>
                <button
                  type="button"
                  className="admin-btn-danger h-8 px-3 text-[11px]"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, hero: prev.hero.filter((_, i) => i !== index) }))
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-panel grid gap-4 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[11px] tracking-[0.18em] text-[#e4c98a] uppercase">Featured categories</h2>
            <p className="mt-1 text-xs text-muted-foreground">The cover-flow cards under the category pills.</p>
          </div>
          <button
            type="button"
            className="admin-btn-ghost h-8 px-3 text-[11px]"
            onClick={() =>
              setDraft((prev) =>
                prev.featured.length >= 12
                  ? prev
                  : {
                      ...prev,
                      featured: [
                        ...prev.featured,
                        { slug: "new-category", name: "New category", image: "/catalog/wallet-espresso.jpg" },
                      ],
                    },
              )
            }
          >
            Add card
          </button>
        </div>
        <ul className="grid gap-3">
          {draft.featured.map((item, index) => (
            <li key={`featured-${index}`} className="grid gap-3 border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Name</span>
                  <input
                    value={item.name}
                    onChange={(e) => setFeatured(index, { name: e.target.value })}
                    className="admin-field h-10"
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Category slug</span>
                  <input
                    value={item.slug}
                    onChange={(e) => setFeatured(index, { slug: e.target.value })}
                    className="admin-field h-10"
                  />
                </label>
              </div>
              <ImageField label="Image" value={item.image} onChange={(image) => setFeatured(index, { image })} />
              <button
                type="button"
                className="admin-btn-danger h-8 w-fit px-3 text-[11px]"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, featured: prev.featured.filter((_, i) => i !== index) }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-panel grid gap-4 p-4 sm:p-5">
        <div>
          <h2 className="text-[11px] tracking-[0.18em] text-[#e4c98a] uppercase">About</h2>
          <p className="mt-1 text-xs text-muted-foreground">Public page at /about, linked from the footer.</p>
        </div>
        <ImageField
          label="Portrait"
          value={draft.about.image}
          onChange={(image) => setDraft((prev) => ({ ...prev, about: { ...prev.about, image } }))}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Eyebrow</span>
            <input
              value={draft.about.eyebrow}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, about: { ...prev.about, eyebrow: e.target.value } }))
              }
              className="admin-field h-10"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Title</span>
            <input
              value={draft.about.title}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, about: { ...prev.about, title: e.target.value } }))
              }
              className="admin-field h-10"
            />
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">Story</span>
          <textarea
            value={draft.about.body}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, about: { ...prev.about, body: e.target.value } }))
            }
            rows={6}
            className="admin-field h-auto min-h-36 py-2"
          />
        </label>
      </section>

      <section className="admin-panel grid gap-4 p-4 sm:p-5">
        <div>
          <h2 className="text-[11px] tracking-[0.18em] text-[#e4c98a] uppercase">Why shop with us</h2>
          <p className="mt-1 text-xs text-muted-foreground">The four notes under the product sections.</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {draft.trust.map((item, index) => (
            <li key={`trust-${index}`} className="grid gap-2 border border-border p-3">
              <input
                value={item.title}
                onChange={(e) => setTrust(index, { title: e.target.value })}
                className="admin-field h-10"
              />
              <input
                value={item.text}
                onChange={(e) => setTrust(index, { text: e.target.value })}
                className="admin-field h-10"
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-panel grid gap-4 p-4 sm:p-5">
        <div>
          <h2 className="text-[11px] tracking-[0.18em] text-[#e4c98a] uppercase">Policies</h2>
          <p className="mt-1 text-xs text-muted-foreground">Shipping, returns, and privacy pages in the footer.</p>
        </div>
        {POLICY_FIELDS.map((policy) => (
          <div key={policy.slug} className="grid gap-2 border border-border p-3">
            <label className="grid gap-1.5">
              <span className="text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{policy.label} title</span>
              <input
                value={draft.policies[policy.slug].title}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    policies: {
                      ...prev.policies,
                      [policy.slug]: { ...prev.policies[policy.slug], title: e.target.value },
                    },
                  }))
                }
                className="admin-field h-10"
              />
            </label>
            <textarea
              value={draft.policies[policy.slug].body}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  policies: {
                    ...prev.policies,
                    [policy.slug]: { ...prev.policies[policy.slug], body: e.target.value },
                  },
                }))
              }
              rows={4}
              className="admin-field h-auto min-h-24 py-2"
            />
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Saving…" : "Save storefront"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
