"use client";

import type { PublicReview } from "@bismillah/db";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CenteredRuleHeading } from "./section-heading";
import { StarRating } from "./star-rating";

const AUTO_MS = 7000;

function reviewVisuals(review: PublicReview) {
  const photos = review.photos.filter(Boolean);
  const product = review.productImage?.trim() || "";
  const hero = photos[0] || product;
  const extras = photos.length > 1 ? photos.slice(1, 4) : [];
  return { hero, extras, hasCustomerPhoto: photos.length > 0 };
}

export function HomeReviews({ reviews }: { reviews: PublicReview[] }) {
  const slides = reviews.slice(0, 12);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((value) => (value + 1) % slides.length);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  const current = slides[index];
  const visuals = useMemo(() => (current ? reviewVisuals(current) : null), [current]);

  if (!current || !visuals) return null;

  const go = (dir: -1 | 1) => setIndex((value) => (value + dir + slides.length) % slides.length);

  return (
    <section className="border-y border-border bg-[#f6f3ee] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <CenteredRuleHeading size="lg">Customer reviews</CenteredRuleHeading>
        <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-6 text-muted-foreground">
          Notes from people who bought the leather — published after the shop approves them.
        </p>

        <div
          className="relative mx-auto mt-8 max-w-5xl sm:mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous review"
                onClick={() => go(-1)}
                className="absolute top-[42%] left-0 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm sm:size-11"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next review"
                onClick={() => go(1)}
                className="absolute top-[42%] right-0 z-10 flex size-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm sm:size-11"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}

          <article
            key={current.id}
            className="grid overflow-hidden border border-border bg-white md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
          >
            <div className="relative min-h-[17rem] bg-[#eee8df] sm:min-h-[20rem] md:min-h-[26rem]">
              {visuals.hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={visuals.hero}
                  alt={visuals.hasCustomerPhoto ? `Photo from ${current.authorName}` : current.productName}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#e8e0d4]" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-4 sm:p-5">
                <p className="text-xs font-medium tracking-wide text-white sm:text-sm">{current.productName}</p>
              </div>
            </div>

            <div className="flex flex-col justify-center px-5 py-7 sm:px-10 sm:py-10 md:px-12">
              <StarRating value={current.rating} size="lg" />
              {current.title ? (
                <h3 className="font-display mt-4 text-2xl tracking-tight text-foreground sm:text-3xl">
                  {current.title}
                </h3>
              ) : null}
              <p
                className={`max-w-xl text-[15px] leading-7 text-neutral-600 sm:text-base sm:leading-8 ${
                  current.title ? "mt-3" : "mt-5"
                }`}
              >
                “{current.body}”
              </p>

              {visuals.extras.length > 0 ? (
                <ul className="mt-5 flex gap-2.5">
                  {visuals.extras.map((src) => (
                    <li key={src} className="h-20 w-16 overflow-hidden bg-[#eee8df] sm:h-24 sm:w-[4.75rem]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="size-full object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-7 border-t border-border pt-5">
                <p className="text-sm font-medium tracking-wide">{current.authorName}</p>
                <p className="mt-1 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  {current.authorCity || "Bangladesh"}
                  {current.verified ? " · Verified" : ""}
                </p>
                <Link
                  href={`/product/${current.productSlug}`}
                  className="mt-3 inline-block text-xs tracking-wide text-foreground underline underline-offset-4"
                >
                  View {current.productName}
                </Link>
              </div>
            </div>
          </article>

          {slides.length > 1 ? (
            <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Reviews">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Review ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-7 bg-foreground" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
