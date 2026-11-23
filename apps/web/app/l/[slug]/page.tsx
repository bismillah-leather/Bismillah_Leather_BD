import { readPublishedLanding } from "@bismillah/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingView } from "@/components/landing-view";
import { listPublishedProducts } from "@/lib/catalog";
import { epsReady } from "@/lib/eps";
import { getSeoConfig } from "@/lib/seo";
import { publicStoreOrigin } from "@/lib/site-origin";
import { DEFAULT_OG_IMAGE, ogImageTags, shareImageUrl } from "@/lib/social-preview";
import { getStoreBrand } from "@/lib/store-brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [page, origin] = await Promise.all([readPublishedLanding(slug), publicStoreOrigin()]);
  if (!page) return { title: "Landing" };
  const title = page.seoTitle || page.headline;
  const description = page.seoDescription || page.subhead;
  const image = shareImageUrl(origin, page.heroImage || DEFAULT_OG_IMAGE);
  return {
    title,
    description,
    alternates: { canonical: `${origin}/l/${slug}` },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${origin}/l/${slug}`,
      title,
      description,
      images: ogImageTags(image, title),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
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
  const [catalog, brand, epsPay, seo] = await Promise.all([
    listPublishedProducts(),
    getStoreBrand(),
    epsReady(),
    getSeoConfig(),
  ]);
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
  return (
    <LandingView
      page={page}
      products={products}
      whatsappUrl={brand.whatsappUrl}
      onlinePay={epsPay}
      epsPay={epsPay}
      siteFacebookPixelId={seo.facebookPixelId}
      siteTiktokPixelId={seo.tiktokPixelId}
    />
  );
}
