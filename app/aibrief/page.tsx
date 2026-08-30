import { readFileSync } from "fs";
import { join } from "path";
import { Suspense } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import FeedPage from "@/components/FeedPage";

export const metadata: Metadata = {
  title: "ai brief — AI·디자인·PM 업계 뉴스 큐레이션",
  description: "AI·테크·디자인 분야의 새로운 소식을 함께 나눠요.",
  keywords: ["AI 뉴스", "AI 디자인", "UX 뉴스", "PM 뉴스", "프로덕트 매니저", "AI 큐레이션", "테크 뉴스"],
  openGraph: {
    title: "ai brief — AI·디자인·PM 업계 뉴스 큐레이션",
    description: "AI·테크·디자인 분야의 새로운 소식을 함께 나눠요.",
    url: "https://toolr.kr/aibrief",
    siteName: "toolr",
    locale: "ko_KR",
    type: "website",
  },
  alternates: { canonical: "https://toolr.kr/aibrief" },
  twitter: {
    card: "summary",
    title: "ai brief — AI·디자인·PM 업계 뉴스 큐레이션",
    description: "AI·테크·디자인 분야의 새로운 소식을 함께 나눠요.",
  },
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ai brief — AI·디자인·PM 업계 뉴스 큐레이션",
    "description": "AI·테크·디자인 분야의 새로운 소식을 함께 나눠요.",
    "url": "https://toolr.kr/aibrief",
    "isPartOf": { "@type": "WebSite", "name": "toolr", "url": "https://toolr.kr" },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": articles.slice(0, 30).map((a, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://toolr.kr/aibrief/article/${a.slug}`,
        "name": a.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <FeedPage articles={articles} />
      </Suspense>
    </>
  );
}
