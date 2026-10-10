import { categoryBySlug, INITIAL_CATEGORIES } from "@bismillah/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export function generateStaticParams() {
  return INITIAL_CATEGORIES.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.blurb,
  };
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Loading category…</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        {category.group}
      </p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">{category.name}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">{category.blurb}</p>
      <div className="mt-10 rounded-lg border border-dashed border-border px-5 py-12 text-center">
        <p className="font-display text-2xl">Nothing published in this category yet.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Products appear here after they are published from the admin. Photos, price, and stock
          come from the catalog, not from this page.
        </p>
      </div>
    </div>
  );
}
