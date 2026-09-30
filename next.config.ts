import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright loads the dev server through 127.0.0.1; without this, client scripts are blocked and nothing hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
