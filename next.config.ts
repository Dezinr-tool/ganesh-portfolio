import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@react-pdf/renderer",
    "qrcode",
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "jszip",
  ],
  env: {
    EA_PASSWORD: process.env.EA_PASSWORD,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "olhalazarieva.com",
      },
    ],
  },
};

export default nextConfig;
