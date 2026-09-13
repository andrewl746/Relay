import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Listing photos are resized client-side but still ride in the action
      // body as a data URL; leave headroom over the 1MB default.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // The built-in optimizer spawns a sharp/jest-worker pool on first
    // request; on a memory-tight dev machine that pool crashes repeatedly
    // ("Jest worker encountered N child process exceptions") instead of
    // serving the image. Every <Image> here is already a small local asset
    // (the wordmark, a demo avatar), so there's nothing worth resizing —
    // serve it as-is and skip the worker pool entirely.
    unoptimized: true,
  },
  async redirects() {
    // Setup moved off its own pages and into Parcel's corner on the site, so
    // old links to a step land on the board, where the corner picks up.
    return [{ source: "/onboarding/:step(profile|verify|interests|wants)", destination: "/", permanent: false }];
  },
};

export default nextConfig;
