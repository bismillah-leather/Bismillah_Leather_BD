import type { Metadata } from "next";
import { getStorefrontContent } from "@/lib/storefront-content";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getStorefrontContent();
  return { title: about.title };
}

export default async function AboutPage() {
  const { about } = await getStorefrontContent();
  const paragraphs = about.body
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <article className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:py-16">
      <div
        className="aspect-[4/5] bg-neutral-200 bg-cover bg-center"
        style={{ backgroundImage: `url("${about.image.replace(/"/g, "")}")` }}
        role="img"
        aria-label=""
      />
      <div>
        <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">{about.eyebrow}</p>
        <h1 className="font-display mt-3 text-4xl leading-none tracking-tight sm:text-6xl">{about.title}</h1>
        <div className="mt-6 grid gap-4 text-sm leading-7 text-muted-foreground sm:text-base">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
