export const dynamic = "force-dynamic";

import { readLandingPages } from "@bismillah/db";
import { INITIAL_CATEGORIES } from "@bismillah/shared";
import type { MetadataRoute } from "next";
import { listPublishedProducts } from "@/lib/catalog";
import { publicStoreOrigin } from "@/lib/site-origin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await publicStoreOrigin();
  const now = new Date();
  const [products, landings] = await Promise.all([
    listPublishedProducts(),
    readLandingPages(),
  ]);

  const staticPaths: MetadataRoute.Sitemap = [
    { url: origin, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${origin}/search`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${origin}/policies/shipping`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/policies/returns`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${origin}/policies/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...INITIAL_CATEGORIES.map((category) => ({
      url: `${origin}/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const productPaths: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${origin}/product/${product.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const landingPaths: MetadataRoute.Sitemap = landings
    .filter((page) => page.published)
    .map((page) => ({
      url: `${origin}/l/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticPaths, ...productPaths, ...landingPaths];
}
