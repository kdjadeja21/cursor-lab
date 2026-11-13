import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@seedlayer/core", "@seedlayer/packs", "handlebars"],
};

export default nextConfig;
