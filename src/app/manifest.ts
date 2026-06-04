import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PickPal",
    short_name: "PickPal",
    description:
      "Recuerda fechas importantes y recibe ideas de regalo personalizadas con IA.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7EE",
    theme_color: "#FBF7EE",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
