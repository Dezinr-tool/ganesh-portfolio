import type { MetadataRoute } from "next";

/** Shared PWA manifest — same ga icon as site favicon across all routes. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ganesh Das — Design & Strategy Partner",
    short_name: "Ganesh Das",
    description:
      "Design & Strategy Partner for Startups. Portfolio, dashboard, and tools by Ganesh Das.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
