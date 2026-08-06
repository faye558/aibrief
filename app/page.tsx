import { readFileSync } from "fs";
import { join } from "path";
import { Suspense } from "react";
import FeedPage from "@/components/FeedPage";

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
}

function loadArticles(): Article[] {
  const filePath = join(process.cwd(), "data", "articles.json");
  const raw = readFileSync(filePath, "utf-8");
  const all: Article[] = JSON.parse(raw);
  return all
    .filter((a) => !a.hidden)
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
