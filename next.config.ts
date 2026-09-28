import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home folder confuses workspace-root detection.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
