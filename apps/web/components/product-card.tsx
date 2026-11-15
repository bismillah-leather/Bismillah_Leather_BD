"use client";

import { formatPaisa, SHOWCASE_PRODUCTS, type ShowcaseProduct } from "@bismillah/shared";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductCardActions } from "./product-card-actions";
import { ProductShotBadges } from "./product-shot-badges";

function facesFor(product: ShowcaseProduct) {
  const related = SHOWCASE_PRODUCTS.filter(
    (item) => item.kind === product.kind && item.slug !== product.slug,
  ).map((item) => item.image);
  return [...new Set([product.image, ...related])].slice(0, 4);
}

export function ProductCard({ product }: { product: ShowcaseProduct }) {
  const faces = useMemo(() => facesFor(product), [product]);
  const [hover, setHover] = useState(false);
  const [face, setFace] = useState(0);
  const price = product.salePaisa ?? product.pricePaisa;
  const color = product.colors[0] ?? "Black";

  useEffect(() => {
    if (!hover || faces.length < 2) return;
    const timer = window.setInterval(() => {
      setFace((value) => (value + 1) % faces.length);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [faces.length, hover]);

  return (
    <article
      className="group relative flex h-full flex-col"
      onMouseEnter={() => {
        setHover(true);
        setFace(faces.length > 1 ? 1 : 0);
      }}
      onMouseLeave={() => {
        setHover(false);
        setFace(0);
      }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden bg-secondary"
      >
        {faces.map((src, faceIndex) => (
          <Image
            key={`${product.slug}-${src}-${faceIndex}`}
            src={src}
            alt={faceIndex === 0 ? product.name : ""}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={`object-cover transition duration-500 ease-out ${
              faceIndex === face ? "opacity-100" : "opacity-0"
            } ${hover ? "scale-105" : "scale-100"}`}
          />
        ))}

        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5">
          {product.salePaisa ? (
            <span className="bg-black px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-white uppercase">
              Sale
            </span>
          ) : null}
          {!product.inStock ? (
            <span className="bg-black px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-white uppercase">
              Sold out
            </span>
          ) : null}
        </div>

        {faces.length > 1 ? (
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1 opacity-0 transition group-hover:opacity-100">
            {faces.map((_, faceIndex) => (
              <span
                key={faceIndex}
                className={`h-1 rounded-full bg-white transition-all ${
                  faceIndex === face ? "w-3.5" : "w-1.5 opacity-50"
                }`}
              />
            ))}
          </div>
        ) : null}
      </Link>
      <ProductShotBadges slug={product.slug} isNew={product.isNew} />

      <div className="mt-2.5 flex flex-1 flex-col">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[13px] leading-snug text-foreground transition group-hover:underline sm:text-sm">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          {product.colors.join(" · ")}
        </p>
        <p className="mt-1.5 text-[13px] sm:text-sm">
          <span className="font-medium">{formatPaisa(price)}</span>
          {product.salePaisa ? (
            <span className="ml-2 text-muted-foreground line-through">
              {formatPaisa(product.pricePaisa)}
            </span>
          ) : null}
        </p>
        <div className="mt-auto pt-2.5">
          <ProductCardActions slug={product.slug} color={color} inStock={product.inStock} compact />
        </div>
      </div>
    </article>
  );
}
