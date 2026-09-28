import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray package-lock.json in the home folder confuses workspace-root detection.
  turbopack: { root: import.meta.dirname },
  // Browsers ask for /favicon.ico on their own; point them at the SVG icon.
  async redirects() {
    return [{ source: "/favicon.ico", destination: "/icon.svg", permanent: true }];
  },
};

export default nextConfig;
