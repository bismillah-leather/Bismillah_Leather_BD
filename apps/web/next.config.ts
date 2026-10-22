import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(rootDir);

const adminDevOrigin = process.env.ADMIN_DEV_ORIGIN ?? "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@bismillah/ui", "@bismillah/shared", "@bismillah/db"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Vercel multi-service currently 404s /_next/image; serve public/catalog directly.
  images: {
    unoptimized: true,
    localPatterns: [{ pathname: "/catalog/**" }],
  },
  // Local: storefront :3000 proxies /admin → admin app :3001 (prod uses vercel.json services).
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      { source: "/admin", destination: `${adminDevOrigin}/admin` },
      { source: "/admin/:path*", destination: `${adminDevOrigin}/admin/:path*` },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
