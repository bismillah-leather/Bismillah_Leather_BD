"use client";

import { blankLanding, type LandingPage } from "@bismillah/shared";
import { Copy, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin-page-header";

const inputClass =
  "h-10 w-full border border-[#d4d4d4] bg-white px-3 text-sm text-black outline-none focus:border-black";
const areaClass =
  "min-h-24 w-full border border-[#d4d4d4] bg-white px-3 py-2 text-sm text-black outline-none focus:border-black";

function Field({
  label,
  value,
  onChange,
  area,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  area?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] tracking-[0.12em] text-neutral-500 uppercase">{label}</span>
      {area ? (
        <textarea className={areaClass} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  storeOrigin,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  storeOrigin: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = value.startsWith("/") ? `${storeOrigin}${value}` : value;

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/admin/api/content/image", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error || "Upload failed.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-[11px] tracking-[0.12em] text-neutral-500 uppercase">{label}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid h-24 w-full place-items-center overflow-hidden border border-black/10 bg-neutral-100 sm:w-28">
          {preview ? <img src={preview} alt="" className="size-full object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <input className={inputClass} value={value} onChange={(event) => onChange(event.target.value)} />
          <label className="mt-2 inline-flex h-9 cursor-pointer items-center border border-black px-3 text-xs">
            {busy ? "Uploading…" : "Upload photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
          {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function LandingStudio({
  initial,
  storeOrigin,
}: {
  initial: LandingPage[];
  storeOrigin: string;
}) {
  const [pages, setPages] = useState(initial);
  const [selected, setSelected] = useState(initial[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const page = useMemo(() => pages.find((item) => item.id === selected) ?? null, [pages, selected]);

  function patch(next: Partial<LandingPage>) {
    setPages((current) => current.map((item) => (item.id === selected ? { ...item, ...next } : item)));
  }

  function create() {
    const created = blankLanding(crypto.randomUUID(), `Landing ${pages.length + 1}`);
    setPages((current) => [created, ...current]);
    setSelected(created.id);
    setStatus("New page is ready. Save to publish the link.");
  }

  function duplicate(source: LandingPage) {
    const copy = {
      ...source,
      id: crypto.randomUUID(),
      name: `${source.name} copy`.slice(0, 80),
      slug: `${source.slug}-copy`.slice(0, 60),
      published: false,
    };
    setPages((current) => [copy, ...current]);
    setSelected(copy.id);
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/admin/api/landings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      const data = (await response.json()) as { pages?: LandingPage[]; error?: string };
      if (!response.ok || !data.pages) {
        setStatus(data.error || "Could not save.");
        return;
      }
      setPages(data.pages);
      if (!data.pages.some((item) => item.id === selected)) setSelected(data.pages[0]?.id ?? "");
      setStatus("Saved. Published pages are live on the store.");
    } catch {
      setStatus("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Landing pages"
        description="Build a campaign page, turn ads on with a pixel id, then open the public link."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={create} className="inline-flex h-10 items-center gap-1.5 border border-black px-3 text-sm">
              <Plus className="size-4" />
              New page
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex h-10 items-center bg-black px-4 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      />
      {status ? <p className="text-sm text-neutral-600">{status}</p> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="border border-black/10">
          {pages.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">No landing pages yet.</p>
          ) : (
            <ul>
              {pages.map((item) => (
                <li key={item.id} className="border-b border-black/10 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={`block w-full px-3 py-3 text-left ${item.id === selected ? "bg-black text-white" : "bg-white"}`}
                  >
                    <span className="block truncate text-sm font-medium">{item.name}</span>
                    <span className={`mt-0.5 block truncate text-xs ${item.id === selected ? "text-white/70" : "text-neutral-500"}`}>
                      /l/{item.slug} · {item.published ? "Live" : "Draft"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {page ? (
          <div className="grid gap-6">
            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Page</h2>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`${storeOrigin}/l/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-1 border border-black px-3 text-xs"
                  >
                    Open
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button type="button" onClick={() => duplicate(page)} className="inline-flex h-9 items-center gap-1 border border-black px-3 text-xs">
                    <Copy className="size-3.5" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPages((current) => current.filter((item) => item.id !== page.id));
                      setSelected(pages.find((item) => item.id !== page.id)?.id ?? "");
                    }}
                    className="inline-flex h-9 items-center gap-1 border border-black px-3 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={page.published}
                  onChange={(event) => patch({ published: event.target.checked })}
                />
                Published — ads and the public link only work when this is on
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={page.name} onChange={(name) => patch({ name })} />
                <Field label="Slug" value={page.slug} onChange={(slug) => patch({ slug })} />
                <Field label="SEO title" value={page.seoTitle} onChange={(seoTitle) => patch({ seoTitle })} />
                <Field label="SEO description" value={page.seoDescription} onChange={(seoDescription) => patch({ seoDescription })} />
              </div>
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <h2 className="font-display text-2xl">Ads</h2>
              <p className="text-sm text-neutral-600">
                Paste the numeric Facebook pixel id or the TikTok pixel id. The page fires a PageView when it is published. Leave blank to keep ads off.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Facebook pixel id" value={page.facebookPixelId} onChange={(facebookPixelId) => patch({ facebookPixelId })} />
                <Field label="TikTok pixel id" value={page.tiktokPixelId} onChange={(tiktokPixelId) => patch({ tiktokPixelId })} />
              </div>
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <h2 className="font-display text-2xl">Hero</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Eyebrow" value={page.eyebrow} onChange={(eyebrow) => patch({ eyebrow })} />
                <Field label="Headline" value={page.headline} onChange={(headline) => patch({ headline })} />
                <Field label="Subhead" value={page.subhead} onChange={(subhead) => patch({ subhead })} area />
                <Field label="Offer bar" value={page.offer} onChange={(offer) => patch({ offer })} />
                <Field label="Primary button" value={page.primaryLabel} onChange={(primaryLabel) => patch({ primaryLabel })} />
                <Field label="Primary link" value={page.primaryHref} onChange={(primaryHref) => patch({ primaryHref })} />
                <Field label="Second button" value={page.secondaryLabel} onChange={(secondaryLabel) => patch({ secondaryLabel })} />
                <Field label="Second link" value={page.secondaryHref} onChange={(secondaryHref) => patch({ secondaryHref })} />
              </div>
              <ImageField label="Hero photo" value={page.heroImage} storeOrigin={storeOrigin} onChange={(heroImage) => patch({ heroImage })} />
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Stats</h2>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => patch({ stats: [...page.stats, { value: "New", label: "Label" }].slice(0, 6) })}
                >
                  Add stat
                </button>
              </div>
              {page.stats.map((stat, index) => (
                <div key={index} className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
                  <Field label="Value" value={stat.value} onChange={(value) => patch({ stats: page.stats.map((row, i) => (i === index ? { ...row, value } : row)) })} />
                  <Field label="Label" value={stat.label} onChange={(label) => patch({ stats: page.stats.map((row, i) => (i === index ? { ...row, label } : row)) })} />
                  <button type="button" className="self-end pb-2 text-xs underline" onClick={() => patch({ stats: page.stats.filter((_, i) => i !== index) })}>
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <Field label="Benefits heading" value={page.benefitsTitle} onChange={(benefitsTitle) => patch({ benefitsTitle })} />
              <button
                type="button"
                className="justify-self-start text-xs underline"
                onClick={() => patch({ benefits: [...page.benefits, { title: "New point", text: "Write the reason.", image: "" }].slice(0, 8) })}
              >
                Add benefit
              </button>
              {page.benefits.map((benefit, index) => (
                <div key={index} className="grid gap-3 border-t border-black/10 pt-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Title" value={benefit.title} onChange={(title) => patch({ benefits: page.benefits.map((row, i) => (i === index ? { ...row, title } : row)) })} />
                    <Field label="Text" value={benefit.text} onChange={(text) => patch({ benefits: page.benefits.map((row, i) => (i === index ? { ...row, text } : row)) })} />
                  </div>
                  <ImageField
                    label="Photo"
                    value={benefit.image}
                    storeOrigin={storeOrigin}
                    onChange={(image) => patch({ benefits: page.benefits.map((row, i) => (i === index ? { ...row, image } : row)) })}
                  />
                  <button type="button" className="justify-self-start text-xs underline" onClick={() => patch({ benefits: page.benefits.filter((_, i) => i !== index) })}>
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <h2 className="font-display text-2xl">Story</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Eyebrow" value={page.storyEyebrow} onChange={(storyEyebrow) => patch({ storyEyebrow })} />
                <Field label="Title" value={page.storyTitle} onChange={(storyTitle) => patch({ storyTitle })} />
              </div>
              <Field label="Body" value={page.storyBody} onChange={(storyBody) => patch({ storyBody })} area />
              <ImageField label="Story photo" value={page.storyImage} storeOrigin={storeOrigin} onChange={(storyImage) => patch({ storyImage })} />
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <Field label="Reviews heading" value={page.quotesTitle} onChange={(quotesTitle) => patch({ quotesTitle })} />
              <button
                type="button"
                className="justify-self-start text-xs underline"
                onClick={() => patch({ quotes: [...page.quotes, { quote: "A short line from a customer.", name: "Name", detail: "City", image: "" }].slice(0, 6) })}
              >
                Add review
              </button>
              {page.quotes.map((quote, index) => (
                <div key={index} className="grid gap-3 border-t border-black/10 pt-3">
                  <Field label="Quote" value={quote.quote} onChange={(words) => patch({ quotes: page.quotes.map((row, i) => (i === index ? { ...row, quote: words } : row)) })} area />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" value={quote.name} onChange={(name) => patch({ quotes: page.quotes.map((row, i) => (i === index ? { ...row, name } : row)) })} />
                    <Field label="Detail" value={quote.detail} onChange={(detail) => patch({ quotes: page.quotes.map((row, i) => (i === index ? { ...row, detail } : row)) })} />
                  </div>
                  <ImageField
                    label="Photo"
                    value={quote.image}
                    storeOrigin={storeOrigin}
                    onChange={(image) => patch({ quotes: page.quotes.map((row, i) => (i === index ? { ...row, image } : row)) })}
                  />
                  <button type="button" className="justify-self-start text-xs underline" onClick={() => patch({ quotes: page.quotes.filter((_, i) => i !== index) })}>
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <Field label="FAQ heading" value={page.faqTitle} onChange={(faqTitle) => patch({ faqTitle })} />
              <button
                type="button"
                className="justify-self-start text-xs underline"
                onClick={() => patch({ faqs: [...page.faqs, { question: "New question?", answer: "The answer." }].slice(0, 8) })}
              >
                Add question
              </button>
              {page.faqs.map((faq, index) => (
                <div key={index} className="grid gap-3 border-t border-black/10 pt-3">
                  <Field label="Question" value={faq.question} onChange={(question) => patch({ faqs: page.faqs.map((row, i) => (i === index ? { ...row, question } : row)) })} />
                  <Field label="Answer" value={faq.answer} onChange={(answer) => patch({ faqs: page.faqs.map((row, i) => (i === index ? { ...row, answer } : row)) })} area />
                  <button type="button" className="justify-self-start text-xs underline" onClick={() => patch({ faqs: page.faqs.filter((_, i) => i !== index) })}>
                    Remove
                  </button>
                </div>
              ))}
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <h2 className="font-display text-2xl">Order form</h2>
              <p className="text-sm text-neutral-600">
                Order now jumps to this form. Name, phone, address, district, delivery, and quantity are collected here. Leave product slugs empty to show the in-stock shop pieces.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Form heading" value={page.orderTitle} onChange={(orderTitle) => patch({ orderTitle })} />
                <Field label="Submit button" value={page.orderButton} onChange={(orderButton) => patch({ orderButton })} />
              </div>
              <Field label="Form note" value={page.orderNote} onChange={(orderNote) => patch({ orderNote })} />
              <Field
                label="Product slugs, optional"
                value={page.productSlugs.join(", ")}
                onChange={(value) => patch({ productSlugs: value.split(/[\s,]+/).map((slug) => slug.trim()).filter(Boolean) })}
              />
            </section>

            <section className="grid gap-4 border border-black/10 p-4 sm:p-5">
              <h2 className="font-display text-2xl">Closing</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title" value={page.closingTitle} onChange={(closingTitle) => patch({ closingTitle })} />
                <Field label="Text" value={page.closingBody} onChange={(closingBody) => patch({ closingBody })} />
                <Field label="Button" value={page.closingLabel} onChange={(closingLabel) => patch({ closingLabel })} />
                <Field label="Button link" value={page.closingHref} onChange={(closingHref) => patch({ closingHref })} />
              </div>
            </section>
          </div>
        ) : (
          <p className="border border-dashed border-black/20 p-8 text-sm text-neutral-500">
            Create a landing page to start. It already includes the hero, offer, stats, story, reviews, FAQ, and closing button.
          </p>
        )}
      </div>
    </div>
  );
}
