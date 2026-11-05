import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The Supabase URL isn't secret, and the browser needs it for image URLs.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
  },
  experimental: {
    serverActions: {
      // Images may be up to 1 MB (see src/lib/images.ts), plus room for the
      // multipart overhead.
      bodySizeLimit: "1.1mb",
    },
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
