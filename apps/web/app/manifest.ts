export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getStoreBrand } from "@/lib/store-brand";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const brand = await getStoreBrand();
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111111",
    icons: [
      { src: "/brand/favicon.png?v=20261126", sizes: "48x48", type: "image/png", purpose: "any" },
      { src: "/brand/apple-icon.png?v=20261126", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
