import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL;

if(!supabaseUrl) {
  throw new Error("SUPABASE_URL is not set");
}

const supabaseHost = new URL(supabaseUrl);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost.hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
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
