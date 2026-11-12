import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(rootDir);

const nextConfig: NextConfig = {
  // Public URL is /admin/* via Vercel Services rewrites.
  basePath: "/admin",
  experimental: {
    proxyClientMaxBodySize: "4mb",
  },
  // Avoid /admin ↔ /admin/ redirect loops with basePath + proxy rewrites.
  skipTrailingSlashRedirect: true,
  transpilePackages: ["@bismillah/ui", "@bismillah/shared", "@bismillah/db"],
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
