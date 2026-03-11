import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://qrisflex.id/",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://qrisflex.id/dashboard",
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: "https://qrisflex.id/api/docs",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];
}
