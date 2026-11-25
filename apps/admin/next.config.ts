import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
loadEnvConfig(rootDir);

const nextConfig: NextConfig = {
  ...(process.env.BUILD_STANDALONE === "1"
    ? { output: "standalone" as const, outputFileTracingRoot: rootDir }
    : {}),
  // Public URL is /admin/* via Vercel Services rewrites.
  basePath: "/admin",
  experimental: {
    proxyClientMaxBodySize: "8mb",
  },
  // Avoid /admin ↔ /admin/ redirect loops with basePath + proxy rewrites.
  skipTrailingSlashRedirect: true,
  transpilePackages: ["@bismillah/ui", "@bismillah/shared", "@bismillah/db", "@bismillah/cache"],
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
