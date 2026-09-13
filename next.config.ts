import type { NextConfig } from "next";

// The marketplace screens were replaced by the borrow · lend · hand-off flow.
// Old links land on the screen that does that job now.
const moved: [source: string, destination: string][] = [
  ["/wants", "/"],
  ["/post", "/shelf"],
  ["/post/room", "/shelf"],
  ["/listings/:path*", "/"],
  ["/notifications", "/handoffs"],
  ["/chains", "/network"],
  ["/account", "/you"],
  ["/login/demo", "/hello"],
  ["/onboarding", "/start"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return moved.map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;
