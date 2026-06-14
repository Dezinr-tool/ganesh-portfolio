import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Virtual EA",
    short_name: "Virtual EA",
    description: "Personal executive assistant for Ganesh Das",
    start_url: "/ea/chat",
    scope: "/ea",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/ganesh-profile.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
