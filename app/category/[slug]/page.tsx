import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import FeedPage from "@/components/FeedPage";
import type { Article } from "@/app/page";

const CATEGORY_MAP: Record<string, { label: string; values: string[] }> = {
  "ai":     { label: "AI",     values: ["AI", "AI모델", "3D AI"] },
  "design": { label: "디자인", values: ["디자인툴", "이미지", "폰트"] },
  "ux":     { label: "UX",     values: ["UX"] },
  "tech":   { label: "테크",   values: ["테크", "테크블로그"] },
};

function loadArticles(): Article[] {
  const filePath = join(process.cwd(), "data", "articles.json");
  const raw = readFileSync(filePath, "utf-8");
  const all: Article[] = JSON.parse(raw);
  return all
    .filter((a) => !a.hidden && !a.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function generateStaticParams() {
  return Object.keys(CATEGORY_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = CATEGORY_MAP[slug];
  if (!cat) return {};
  return {
    title: `${cat.label} — aibrief`,
    description: `${cat.label} 관련 최신 뉴스와 인사이트`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = CATEGORY_MAP[slug];
  if (!cat) notFound();

  const articles = loadArticles().filter((a) => cat.values.includes(a.category));

  return (
    <Suspense>
      <FeedPage articles={articles} categoryFilter={cat.label} />
    </Suspense>
  );
}
