import articlesData from "@/data/articles.json";
import type { Article } from "@/types/article";

const articles: Article[] = articlesData as Article[];

export function getAllArticles(): Article[] {
  return articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getFilteredArticles(company?: string, category?: string): Article[] {
  let result = getAllArticles();
  if (company && company !== "전체") {
    result = result.filter((a) => a.company === company);
  }
  if (category && category !== "전체") {
    result = result.filter((a) => a.category === category);
  }
  return result;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}
