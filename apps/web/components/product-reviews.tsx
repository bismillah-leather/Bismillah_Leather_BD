"use client";

import type { PublicReview } from "@bismillah/db";
import { Check, ChevronDown, ImagePlus, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { StarRating } from "./star-rating";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Drawer({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-xl tracking-tight sm:text-2xl">{title}</span>
        <ChevronDown
          className={`size-5 text-neutral-500 transition duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">{open ? <div className="pb-8">{children}</div> : null}</div>
      </div>
    </div>
  );
}

function GoldStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5"
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            <svg width="28" height="28" viewBox="0 0 20 20" aria-hidden>
              <path
                d="M10 1.8 12.5 7l5.7.5-4.3 3.7 1.3 5.6L10 14.2 4.8 16.8l1.3-5.6L1.8 7.5 7.5 7 10 1.8Z"
                fill={star <= value ? "#EAB308" : "none"}
                stroke="#EAB308"
                strokeWidth="1.15"
              />
            </svg>
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-neutral-800">{value.toFixed(1)}</span>
    </div>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">
      {children}
      {required ? <span className="text-red-600"> *</span> : null}
    </span>
  );
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none transition focus:border-neutral-800";

export function ProductReviews({
  productId,
  reviews,
  highlights,
  customerName = "",
}: {
  productId: string;
  reviews: PublicReview[];
  highlights: readonly string[];
  customerName?: string;
}) {
  const [open, setOpen] = useState<"highlights" | "reviews" | null>(
    highlights.length > 0 ? "highlights" : null,
  );
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState(customerName);
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorAddress, setAuthorAddress] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = 4 - photos.length;
    const batch = [...files].slice(0, room);
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of batch) {
        if (file.size > 5 * 1024 * 1024) {
          setError("Each photo must be under 5 MB.");
          continue;
        }
        const data = new FormData();
        data.set("file", file);
        const res = await fetch("/api/reviews/photos", { method: "POST", body: data });
        const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !json.url) {
          setError(json.error ?? "Could not upload photo.");
          continue;
        }
        urls.push(json.url);
      }
      if (urls.length) setPhotos((prev) => [...prev, ...urls].slice(0, 4));
    } catch {
      setError("Could not upload photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          authorName,
          authorEmail,
          authorAddress,
          body,
          photoUrls: photos,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send review.");
        return;
      }
      setDone(true);
      setBody("");
      setPhotos([]);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-b border-border bg-[#f6f3ee] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.7fr)] lg:gap-16">
        <div>
          {highlights.length > 0 ? (
            <Drawer
              title="Highlights"
              open={open === "highlights"}
              onToggle={() => setOpen(open === "highlights" ? null : "highlights")}
            >
              <ul className="grid gap-2.5">
                {highlights.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm leading-6 text-neutral-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-neutral-500" strokeWidth={2} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Drawer>
          ) : null}

          <Drawer
            title="Reviews"
            open={open === "reviews"}
            onToggle={() => setOpen(open === "reviews" ? null : "reviews")}
          >
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-500">No reviews yet. Be the first to review this product!</p>
            ) : (
              <div className="mb-6 grid gap-4">
                {reviews.map((review) => (
                  <article key={review.id} className="border-b border-neutral-200 pb-4 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarRating value={review.rating} />
                      <p className="text-xs text-neutral-400">{formatWhen(review.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-neutral-700">{review.body}</p>
                    {review.photos.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {review.photos.map((src) => (
                          <li key={src} className="size-16 overflow-hidden rounded-md bg-neutral-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="size-full object-cover" />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-3 text-xs tracking-[0.12em] text-neutral-500 uppercase">
                      {review.authorName}
                      {review.authorCity ? ` · ${review.authorCity}` : ""}
                      {review.verified ? " · Verified purchase" : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {done ? (
              <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
                <p className="font-display text-2xl tracking-tight">Thank you</p>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Your review is with the shop. It appears here after we approve it.
                </p>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:px-8 sm:py-8"
              >
                <h3 className="font-display text-xl tracking-tight sm:text-2xl">Write a review</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Share your thoughts. Required fields are marked <span className="text-red-600">*</span>.
                </p>
                <div className="mt-5 border-t border-neutral-100 pt-5">
                  <FieldLabel required>Your rating</FieldLabel>
                  <div className="mt-2">
                    <GoldStars value={rating} onChange={setRating} />
                  </div>
                </div>
                <label className="mt-5 block">
                  <FieldLabel required>Your review</FieldLabel>
                  <textarea
                    required
                    minLength={12}
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="What did you think?"
                    className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-800"
                  />
                </label>
                <div className="mt-5">
                  <FieldLabel>Add photos</FieldLabel>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photos.map((src) => (
                      <span key={src} className="relative size-16 overflow-hidden rounded-lg border border-neutral-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="size-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove photo"
                          onClick={() => setPhotos((prev) => prev.filter((item) => item !== src))}
                          className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                    {photos.length < 4 ? (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex size-16 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 text-[10px] tracking-[0.12em] text-neutral-500 uppercase"
                      >
                        <ImagePlus className="mb-1 size-5" strokeWidth={1.5} />
                        {uploading ? "…" : "Add"}
                      </button>
                    ) : null}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(e) => addPhotos(e.target.files)}
                  />
                  <p className="mt-2 text-xs text-neutral-400">Optional. Up to 4 photos, 5MB each.</p>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label>
                    <FieldLabel required>Name</FieldLabel>
                    <input
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </label>
                  <label>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="mt-5 block">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                    Optional
                  </span>
                  <span className="mt-2 block">
                    <FieldLabel>Address</FieldLabel>
                  </span>
                  <input
                    value={authorAddress}
                    onChange={(e) => setAuthorAddress(e.target.value)}
                    placeholder="City or delivery address"
                    className={inputClass}
                  />
                </label>
                {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
                <button
                  type="submit"
                  disabled={pending || uploading}
                  className="mt-6 h-11 rounded-lg bg-neutral-950 px-6 text-xs font-medium tracking-[0.14em] text-white uppercase disabled:opacity-60"
                >
                  {pending ? "Sending…" : "Submit review"}
                </button>
                <p className="mt-3 text-xs leading-5 text-neutral-400">
                  Reviews are published after the shop approves them.
                </p>
              </form>
            )}
          </Drawer>
        </div>
      </div>
    </section>
  );
}
