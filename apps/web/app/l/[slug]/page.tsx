import { readPublishedLanding } from "@bismillah/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingView } from "@/components/landing-view";
import { listPublishedProducts } from "@/lib/catalog";
import { getStoreBrand } from "@/lib/store-brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await readPublishedLanding(slug);
  if (!page) return { title: "Landing" };
  return {
    title: page.seoTitle || page.headline,
    description: page.seoDescription || page.subhead,
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await readPublishedLanding(slug);
  if (!page) notFound();
  const [catalog, brand] = await Promise.all([listPublishedProducts(), getStoreBrand()]);
  const picked = page.productSlugs
    .map((item) => catalog.find((product) => product.slug === item))
    .filter((product) => product != null);
  const source = picked.length > 0 ? picked : catalog.filter((product) => product.inStock).slice(0, 6);
  const products = source.map((product) => {
    const onSale = product.salePaisa != null && product.salePaisa > 0n;
    return {
      slug: product.slug,
      name: product.name,
      image: product.image,
      pricePaisa: String(onSale ? product.salePaisa : product.pricePaisa),
      comparePaisa: onSale && product.salePaisa != null && product.salePaisa < product.pricePaisa ? String(product.pricePaisa) : "",
      colors: [...product.colors],
    };
  });
  return <LandingView page={page} products={products} whatsappUrl={brand.whatsappUrl} />;
}
