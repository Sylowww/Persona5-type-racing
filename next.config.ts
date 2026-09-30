import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright loads the dev server through 127.0.0.1; without this, client scripts are blocked and nothing hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  // Avatars from OAuth providers.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/avatars/**" },
    ],
  },
  async redirects() {
    return [{ source: "/", destination: "/fr", permanent: false }];
  },
};

export default nextConfig;
