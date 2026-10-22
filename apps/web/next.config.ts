import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(rootDir);

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
