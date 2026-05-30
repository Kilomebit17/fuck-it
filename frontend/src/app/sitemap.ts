import type { MetadataRoute } from "next";
import { fetchPostIds } from "@/services/api-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let postEntries: MetadataRoute.Sitemap = [];

  try {
    const posts = await fetchPostIds();
    postEntries = posts.map((post) => ({
      url: `${siteUrl}/post/${post.id}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sitemap generation fails gracefully if backend is unavailable
  }

  return [
    {
      url: `${siteUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.5,
    },
    ...postEntries,
  ];
}
