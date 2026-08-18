import { readFileSync } from "fs";
import { join } from "path";
import { Suspense } from "react";
import type { Metadata } from "next";
import FeedPage from "@/components/FeedPage";

export const metadata: Metadata = {
  title: "ai brief — AI·디자인·PM 업계 뉴스 큐레이션",
  description: "AI 디자인 툴, UX/프로덕트 디자인, PM·BD의 일하는 방식 변화 등 핵심 아티클을 매일 자동 수집·요약합니다.",
  keywords: ["AI 뉴스", "AI 디자인", "UX 뉴스", "PM 뉴스", "프로덕트 매니저", "AI 큐레이션", "테크 뉴스"],
  openGraph: {
    title: "ai brief — AI·디자인·PM 업계 뉴스 큐레이션",
    description: "AI 디자인 툴, UX/프로덕트 디자인, PM·BD의 일하는 방식 변화 등 핵심 아티클을 매일 자동 수집·요약합니다.",
    url: "https://toolr.kr/aibrief",
    siteName: "toolr",
    locale: "ko_KR",
    type: "website",
  },
  alternates: { canonical: "https://toolr.kr/aibrief" },
};

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  company: string;
  category: string;
  date: string;
  tags: string[];
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceName: string;
  content?: string;
  hidden?: boolean;
  draft?: boolean;
  type?: string;
}

function loadArticles(): Article[] {
  const filePath = join(process.cwd(), "data", "articles.json");
  const raw = readFileSync(filePath, "utf-8");
  const all: Article[] = JSON.parse(raw);
  return all
    .filter((a) => !a.hidden && !a.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function Home() {
  const articles = loadArticles();
  return (
    <Suspense>
      <FeedPage articles={articles} />
    </Suspense>
  );
}
