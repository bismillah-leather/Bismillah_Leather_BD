"use client";

import { useState } from "react";

type SeoFields = {
  gtmId: string;
  ga4Id: string;
  googleAdsId: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  facebookPixelId: string;
  tiktokPixelId: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

export function SeoSettingsForm({ initial }: { initial: SeoFields }) {
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SeoFields>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/admin/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save SEO.");
        return;
      }
      setMsg("Saved. Sitemap is /sitemap.xml — paste that in Google Search Console.");
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-panel mt-8 grid max-w-xl gap-5 p-6">
      <div>
        <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Search & ads</p>
        <h2 className="font-display mt-1 text-2xl tracking-tight">Pixels, Tag Manager, SEO</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste GTM (GTM-…) and GA4 (G-…) together if you want both. GA4 gtag loads on every page
          once the G- code is saved. YouTube channel URL is in the store settings above.
        </p>
      </div>
      <Field
        label="Google Tag Manager ID"
        value={form.gtmId}
        onChange={(v) => set("gtmId", v)}
        placeholder="GTM-XXXXXXX"
      />
      <Field
        label="Google Analytics 4"
        value={form.ga4Id}
        onChange={(v) => set("ga4Id", v)}
        placeholder="G-XXXXXXXXXX"
      />
      <Field
        label="Google Ads ID"
        value={form.googleAdsId}
        onChange={(v) => set("googleAdsId", v)}
        placeholder="AW-XXXXXXXXX"
      />
      <Field
        label="Search Console verification"
        value={form.googleSiteVerification}
        onChange={(v) => set("googleSiteVerification", v)}
        placeholder="google-site-verification content value"
      />
      <Field
        label="Bing webmaster verification"
        value={form.bingSiteVerification}
        onChange={(v) => set("bingSiteVerification", v)}
        placeholder="msvalidate.01 content value"
      />
      <Field
        label="Facebook / Meta pixel"
        value={form.facebookPixelId}
        onChange={(v) => set("facebookPixelId", v)}
        placeholder="Numeric pixel id"
      />
      <Field
        label="TikTok pixel"
        value={form.tiktokPixelId}
        onChange={(v) => set("tiktokPixelId", v)}
        placeholder="TikTok pixel id"
      />
      <Field
        label="SEO title (home)"
        value={form.seoTitle}
        onChange={(v) => set("seoTitle", v)}
        placeholder="Leather wallets & belts in Dhaka"
      />
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          SEO description
        </span>
        <textarea
          value={form.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          rows={3}
          className="admin-field h-auto min-h-20 py-2.5"
          placeholder="Genuine leather wallets and belts from Mirpur-10. Cash on delivery across Bangladesh."
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          Keywords
        </span>
        <textarea
          value={form.seoKeywords}
          onChange={(e) => set("seoKeywords", e.target.value)}
          rows={3}
          className="admin-field h-auto min-h-20 py-2.5"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        After save: Search Console → add property → HTML tag (paste the verification value here) →
        Sitemaps → <code className="text-[11px]">/sitemap.xml</code>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending ? "Saving…" : "Save SEO & pixels"}
        </button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-field"
        placeholder={placeholder}
      />
    </label>
  );
}
