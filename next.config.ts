import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/misfinanzas",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Force cache busting: changes hash on every build
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
