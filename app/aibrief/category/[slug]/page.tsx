import { readFileSync } from "fs";
import { join } from "path";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
import FeedPage from "@/components/FeedPage";
import type { Article } from "@/app/aibrief/page";

const CATEGORY_MAP: Record<string, { label: string; title: string; description: string; values: string[] }> = {
  "ai":     { label: "AI",     title: "AI 업계 최신 소식 — ai brief", description: "AI 모델·에이전트 관련 업계 소식을 모아봅니다.", values: ["AI", "AI모델", "3D AI"] },
  "design": { label: "디자인", title: "디자인 툴·트렌드 소식 — ai brief", description: "디자인 툴, 폰트, 이미지 관련 최신 소식을 모아봅니다.", values: ["디자인툴", "이미지", "폰트"] },
  "ux":     { label: "UX",     title: "UX 리서치·디자인 소식 — ai brief", description: "UX 리서치와 디자인 관련 최신 소식을 모아봅니다.", values: ["UX"] },
  "tech":   { label: "테크",   title: "테크 업계 최신 소식 — ai brief", description: "테크 업계 전반의 최신 소식을 모아봅니다.", values: ["테크", "테크블로그"] },
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
    title: cat.title,
    description: cat.description,
    alternates: { canonical: `https://toolr.kr/aibrief/category/${slug}` },
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
