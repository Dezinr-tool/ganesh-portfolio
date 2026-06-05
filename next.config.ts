import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    EA_PASSWORD: process.env.EA_PASSWORD,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
