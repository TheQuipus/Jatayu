import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Shared hosting exposes many CPUs but limits memory/processes per account.
  ...(process.env.npm_lifecycle_event === "build:hostinger"
    ? { experimental: { cpus: 2, staticGenerationMaxConcurrency: 2 } }
    : {}),
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Opt-in static HTML export (not used for Docker `next start`).
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
