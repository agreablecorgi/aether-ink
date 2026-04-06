import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  experimental: {
    // Enable server actions for potential future use
  },
};

export default nextConfig;
