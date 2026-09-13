import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Listing photos are resized client-side but still ride in the action
      // body as a data URL; leave headroom over the 1MB default.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
