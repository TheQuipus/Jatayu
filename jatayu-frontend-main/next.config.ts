import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export only for production builds; dev needs on-demand dynamic routes.
  ...(process.env.NODE_ENV === "production" ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
