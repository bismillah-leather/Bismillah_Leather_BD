import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bismillah/ui", "@bismillah/shared"],
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
