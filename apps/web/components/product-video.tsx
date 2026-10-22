"use client";

import { parseVideoEmbed } from "@bismillah/shared";
import { ExternalLink, Play } from "lucide-react";
import { useState } from "react";

export function ProductVideo({
  videoUrl,
  productName,
  variant = "panel",
}: {
  videoUrl: string | null;
  productName: string;
  /** `panel` = full product-page section; `inline` = buy-column accordion body */
  variant?: "panel" | "inline";
}) {
  const embed = videoUrl ? parseVideoEmbed(videoUrl) : null;
  const [playing, setPlaying] = useState(false);

  if (!embed) return null;

  const frame = (
    <div className="relative aspect-video overflow-hidden bg-neutral-950">
      {!playing ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Play video for ${productName}`}
        >
          <span
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, #fff 0.5px, transparent 0.6px), radial-gradient(circle at 70% 60%, #fff 0.4px, transparent 0.5px)",
              backgroundSize: "22px 22px, 34px 34px",
            }}
          />
          <span className="relative inline-flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition group-hover:scale-105 group-hover:bg-white/20">
            <Play className="size-7 fill-white pl-0.5" strokeWidth={1.5} />
          </span>
        </button>
      ) : (
        <iframe
          title={`${productName} — ${embed.label}`}
          src={`${embed.embedUrl}${embed.provider === "youtube" ? "&autoplay=1" : ""}`}
          className="absolute inset-0 size-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="overflow-hidden border border-border bg-white">
        {frame}
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {embed.provider === "facebook" ? "Facebook" : "YouTube"}
          </p>
          <a
            href={embed.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Open source
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">Product film</p>
            <h2 className="font-display mt-2 text-3xl tracking-tight sm:text-4xl">See it in motion</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Live or reel from our page — the same piece you order.
            </p>
          </div>
          <a
            href={embed.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 border border-border px-4 text-sm transition hover:border-foreground"
          >
            Watch on {embed.provider === "facebook" ? "Facebook" : "YouTube"}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <div className="overflow-hidden border border-border shadow-[0_20px_60px_-40px_rgba(0,0,0,0.45)]">
          {frame}
        </div>
      </div>
    </section>
  );
}
