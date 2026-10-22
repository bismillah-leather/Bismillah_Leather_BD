"use client";

import { isSupportedVideoUrl, parseVideoEmbed } from "@bismillah/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export function ProductVideoEditor({
  productId,
  productName,
  initialUrl,
}: {
  productId: string;
  productName: string;
  initialUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const preview = useMemo(() => {
    const candidate = (liveUrl || url).trim();
    if (!candidate) return null;
    return parseVideoEmbed(candidate);
  }, [liveUrl, url]);

  async function saveVideo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a YouTube or Facebook video link.");
      return;
    }
    if (!isSupportedVideoUrl(trimmed)) {
      setError("Unsupported link. Use YouTube or Facebook video / live / reel.");
      return;
    }
    try {
      const res = await fetch(`/admin/api/products/${productId}/video`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; videoUrl?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save video.");
        return;
      }
      setLiveUrl(data.videoUrl ?? trimmed);
      setUrl(data.videoUrl ?? trimmed);
      setOk("Video saved — shows on the product page.");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error.");
    }
  }

  async function removeVideo() {
    setError(null);
    setOk(null);
    const confirmed = window.confirm(`Remove video from “${productName}”?`);
    if (!confirmed) return;
    try {
      const res = await fetch(`/admin/api/products/${productId}/video`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not delete video.");
        return;
      }
      setLiveUrl(null);
      setUrl("");
      setOk("Video removed.");
      startTransition(() => router.refresh());
    } catch {
      setError("Network error.");
    }
  }

  return (
    <section className="admin-panel mt-8 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-primary uppercase">Film</p>
          <h2 className="font-display mt-1 text-2xl tracking-tight">Product video</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            YouTube or Facebook video / live / reel. Customers see it on the product details page.
          </p>
        </div>
        {liveUrl ? (
          <span className="rounded-md bg-primary/15 px-2.5 py-1 text-[10px] tracking-wide text-primary uppercase">
            Live
          </span>
        ) : (
          <span className="rounded-md border border-border px-2.5 py-1 text-[10px] tracking-wide text-muted-foreground uppercase">
            No video
          </span>
        )}
      </div>

      {preview ? (
        <div className="mt-5 overflow-hidden rounded-md border border-border bg-black">
          <div className="aspect-video w-full">
            <iframe
              title={preview.label}
              src={preview.embedUrl}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="truncate px-3 py-2 text-xs text-muted-foreground">{preview.watchUrl}</p>
        </div>
      ) : null}

      <form onSubmit={saveVideo} className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Video URL
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=… or facebook.com/…/videos/…"
            className="admin-field"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={pending} className="admin-btn-primary">
            {pending ? "Saving…" : liveUrl ? "Update video" : "Add video"}
          </button>
          {liveUrl ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void removeVideo()}
              className="h-11 border border-destructive/40 px-4 text-xs tracking-wide text-destructive uppercase transition hover:bg-destructive/10 disabled:opacity-50"
            >
              Delete video
            </button>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {ok ? <p className="text-sm text-muted-foreground">{ok}</p> : null}
        </div>
      </form>
    </section>
  );
}
