import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = loadArticles().find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: `${article.title} — aibrief`,
    description: article.summary?.slice(0, 160),
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const articles = loadArticles();
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = articles
    .filter((a) => a.category === article.category && a.slug !== slug && !a.hidden)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary?.slice(0, 160),
    datePublished: article.date,
    author: { "@type": "Organization", name: article.company },
    publisher: {
      "@type": "Organization",
      name: "aibrief",
      url: "https://aibrief.toolr.kr",
    },
    url: `https://aibrief.toolr.kr/article/${article.slug}`,
    ...(article.sourceUrl ? { mainEntityOfPage: article.sourceUrl } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleDetail article={article} related={related} />
    </>
  );
}
