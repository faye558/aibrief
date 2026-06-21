import articlesData from "@/data/articles.json";
import type { Article } from "@/types/article";

const articles: Article[] = (articlesData as Article[]).filter((a: any) => !a.hidden);

export function getAllArticles(): Article[] {
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getFilteredArticles(company?: string, category?: string, tag?: string): Article[] {
  let result = getAllArticles();
  if (company && company !== "전체") {
    result = result.filter((a) => a.company === company);
  }
  if (category && category !== "전체") {
    result = result.filter((a) => a.category === category);
  }
  if (tag) {
    result = result.filter((a) => a.tags?.includes(tag));
  }
  return result;
}

export function getPopularTags(limit = 12): string[] {
  const counts: Record<string, number> = {};
  for (const article of articles) {
    for (const tag of article.tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}
