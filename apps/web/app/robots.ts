export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { publicStoreOrigin } from "@/lib/site-origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await publicStoreOrigin();
  return {
    rules: [
      {
        userAgent: "facebookexternalhit",
        allow: "/",
      },
      {
        userAgent: "Facebot",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/product/", "/category/", "/about", "/policies/", "/l/", "/search"],
        disallow: ["/checkout", "/cart", "/account", "/admin", "/pay", "/api"],
      },
      {
        userAgent: "*",
        allow: ["/", "/product/", "/category/"],
        disallow: ["/checkout", "/cart", "/account", "/admin", "/pay", "/api"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, ""),
  };
}
