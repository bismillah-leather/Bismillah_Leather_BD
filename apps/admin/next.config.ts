import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public URL is /admin/* via Vercel Services rewrites.
  basePath: "/admin",
  transpilePackages: ["@bismillah/ui", "@bismillah/shared"],
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
