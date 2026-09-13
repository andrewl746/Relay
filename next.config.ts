import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // onnxruntime-node is a native addon: it has to stay out of the bundle and be
  // required at runtime, or the transformer weights never load.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
