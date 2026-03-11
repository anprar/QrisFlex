import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QrisFlex",
    short_name: "QrisFlex",
    description: "Converter QRIS statis ke dinamis yang cepat, offline-ready, dan API ready.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe3",
    theme_color: "#0e9f6e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
