import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

const ROOT_URL = "https://toolr.kr";
const SITE_URL = "https://toolr.kr/aibrief";

const CATEGORY_SLUGS = ["ai", "design", "ux", "tech"];

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();

  const articleUrls = articles.map((a) => ({
    url: `${SITE_URL}/article/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryUrls = CATEGORY_SLUGS.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [
    { url: ROOT_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/timeline`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${ROOT_URL}/ad-revenue`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...categoryUrls,
    ...articleUrls,
  ];
}
