import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import type { Article } from "@/app/page";
import ArticleDetail from "@/components/ArticleDetail";

function loadArticles(): Article[] {
  const filePath = join(process.cwd(), "data", "articles.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export async function generateStaticParams() {
  const articles = loadArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articles = loadArticles();
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  // 같은 카테고리에서 최신 4개 (현재 기사 제외)
  const related = articles
    .filter((a) => a.category === article.category && a.slug !== slug && !a.hidden)
    .slice(0, 4);

  return <ArticleDetail article={article} related={related} />;
}
