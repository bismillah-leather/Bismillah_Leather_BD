"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { postAdminImage } from "@/lib/admin-image";

type CategoryOption = { id: string; name: string; path: string };

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function ProductCreateForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [priceTaka, setPriceTaka] = useState("1500");
  const [stock, setStock] = useState("10");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const previewSlug = useMemo(
    () => (slugTouched ? slugify(slug) : slugify(name)),
    [name, slug, slugTouched],
  );

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
    if (!skuTouched) {
      const base = slugify(value).replace(/-/g, "").slice(0, 8).toUpperCase() || "ITEM";
      setSku(`BL-${base}-${Math.floor(Math.random() * 90 + 10)}`);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/admin/api/products", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          name,
          slug: previewSlug,
          description,
          categoryId: categoryId || undefined,
          categoryName: newCategory.trim() || undefined,
          sku,
          priceTaka: Number(priceTaka),
          stock: Number(stock),
          status,
          isFeatured,
          isNew,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        product?: { id?: string; name?: string };
      };
      if (!res.ok) {
        setError(data.error ?? "Could not create product.");
        return;
      }
      const createdId = data.product?.id;
      const trimmedVideo = videoUrl.trim();
      if (trimmedVideo && createdId) {
        const videoRes = await fetch(`/admin/api/products/${createdId}/video`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedVideo }),
        });
        if (!videoRes.ok) {
          const videoData = (await videoRes.json().catch(() => ({}))) as { error?: string };
          setOk(`Added “${data.product?.name ?? name}”, but the video link was not saved.`);
          setError(videoData.error ?? "Video link failed.");
          router.refresh();
          return;
        }
      }
      if (photo && createdId) {
        try {
          await postAdminImage(`/admin/api/products/${createdId}/image`, photo);
        } catch (error) {
          setOk(`Added “${data.product?.name ?? name}”, but the photo was not stored.`);
          setError(error instanceof Error ? error.message : "Photo upload failed.");
          setPhoto(null);
          router.refresh();
          return;
        }
      }
      setOk(`Added “${data.product?.name ?? name}”. It is on the store if status is Published.`);
      setName("");
      setSlug("");
      setSlugTouched(false);
      setDescription("");
      setSku("");
      setSkuTouched(false);
      setPriceTaka("1500");
      setStock("10");
      setStatus("published");
      setIsFeatured(false);
      setIsNew(false);
      setNewCategory("");
      setPhoto(null);
      setVideoUrl("");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-8">
      <button type="button" onClick={() => setOpen((v) => !v)} className="admin-btn-primary">
        {open ? "Close" : "Add product"}
      </button>

      {open ? (
        <form onSubmit={onSubmit} className="admin-panel mt-4 grid gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-primary uppercase">New leather SKU</p>
              <h2 className="font-display mt-1 text-2xl tracking-tight">Create product</h2>
            </div>
            <p className="text-xs text-muted-foreground">/{previewSlug || "slug"}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm sm:col-span-2">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Name
              </span>
              <input
                required
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Black Long Wallet"
                className="admin-field"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Slug
              </span>
              <input
                value={slugTouched ? slug : previewSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="admin-field"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Category
              </span>
              {categories.length > 0 ? (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="admin-field"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Wallets"
                  className="admin-field"
                />
              )}
            </label>

            {categories.length > 0 ? (
              <label className="grid gap-2 text-sm">
                <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  Or new category
                </span>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Leave empty to use the list"
                  className="admin-field"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                SKU
              </span>
              <input
                value={sku}
                onChange={(e) => {
                  setSkuTouched(true);
                  setSku(e.target.value.toUpperCase());
                }}
                placeholder="Auto if empty"
                className="admin-field"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Price (৳)
              </span>
              <input
                required
                type="number"
                min={1}
                step={1}
                value={priceTaka}
                onChange={(e) => setPriceTaka(e.target.value)}
                className="admin-field"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Stock (on product page)
              </span>
              <input
                required
                type="number"
                min={0}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="admin-field"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="admin-field"
              >
                <option value="published">Published (live on store)</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label className="flex items-center gap-3 self-end pb-2 text-sm">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="size-4 accent-primary"
              />
              Featured
            </label>
            <label className="flex items-center gap-3 self-end pb-2 text-sm">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="size-4 accent-primary"
              />
              NEW badge
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Facebook / YouTube video (optional)
            </span>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.facebook.com/share/v/… or youtube.com/watch?v=…"
              className="admin-field"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Photo
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="admin-field h-auto py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:text-primary-foreground"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="admin-field h-auto min-h-20 py-2.5"
              placeholder="Full-grain leather, hand-finished edges…"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={pending} className="admin-btn-primary">
              {pending ? "Creating…" : "Save product"}
            </button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {ok ? <p className="text-sm text-muted-foreground">{ok}</p> : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
