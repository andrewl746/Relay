import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // onnxruntime-node is a native addon: it has to stay out of the bundle and be
  // required at runtime, or the transformer weights never load.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
  experimental: {
    serverActions: {
      // Listing photos are resized client-side but still ride in the action
      // body as a data URL; leave headroom over the 1MB default.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
