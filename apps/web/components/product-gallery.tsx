"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  images,
  alt,
}: {
  images: readonly string[];
  alt: string;
}) {
  const shots = images.length > 0 ? images : ["/catalog/wallet-black-long.jpg"];
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
      <ul className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
        {shots.map((src, index) => (
          <li key={src}>
            <button
              type="button"
              onClick={() => setActive(index)}
              className={`relative block size-16 overflow-hidden border ${
                active === index ? "border-foreground" : "border-transparent"
              }`}
              aria-label={`View image ${index + 1}`}
              aria-current={active === index ? "true" : undefined}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative order-1 aspect-[3/4] overflow-hidden bg-[#efeae3] sm:order-2">
        <Image
          src={shots[active] ?? shots[0]!}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
