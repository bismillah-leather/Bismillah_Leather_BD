import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(rootDir);

const adminDevOrigin = process.env.ADMIN_DEV_ORIGIN ?? "http://127.0.0.1:3001";

function r2ImagePattern() {
  const raw = process.env.R2_PUBLIC_URL?.trim();
  if (!raw) return [];
  try {
    const url = new URL(raw);
    const protocol = url.protocol === "http:" ? "http" : "https";
    return [{ protocol, hostname: url.hostname, pathname: "/**" }] as const;
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "1"
    ? { output: "standalone" as const, outputFileTracingRoot: rootDir }
    : {}),
  transpilePackages: ["@bismillah/ui", "@bismillah/shared", "@bismillah/db", "@bismillah/cache"],
  experimental: {
    agentFeedback: true,
  },
  // Keep off on Hobby: Cache Components + root layout DB reads fail Vercel prerender
  // (/_not-found, /) even when local builds pass. Re-enable after Suspense/"use cache"
  // coverage is complete for catalog + account routes.
  cacheComponents: false,
  // Vercel multi-service currently 404s /_next/image; serve public/catalog directly.
  images: {
    unoptimized: true,
    localPatterns: [
      { pathname: "/catalog/**" },
      { pathname: "/uploads/**" },
      { pathname: "/brand/**" },
      { pathname: "/support-avatar.jpg" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com", pathname: "/**" },
      ...r2ImagePattern(),
    ],
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
