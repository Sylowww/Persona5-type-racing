import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright loads the dev server through 127.0.0.1; without this, client scripts are blocked and nothing hydrates.
  // ALLOWED_DEV_ORIGINS adds hosts for playing from other devices on the network (e.g. "10.3.3.55").
  allowedDevOrigins: [
    "127.0.0.1",
    ...(process.env.ALLOWED_DEV_ORIGINS ?? "").split(",").map((host) => host.trim()).filter(Boolean),
  ],
  // Profile pictures go through a Server Action: up to 2 MB (checked again on the server) plus form overhead.
  experimental: {
    serverActions: { bodySizeLimit: "3mb" },
  },
  // Avatars from OAuth providers.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/avatars/**" },
    ],
  },
};

export default nextConfig;
