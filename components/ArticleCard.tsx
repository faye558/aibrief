import Link from "next/link";
import type { Article } from "@/types/article";
import { formatDate } from "@/lib/articles";

const COMPANY_COLORS: Record<string, string> = {
  Anthropic: "bg-orange-100 text-orange-700",
  OpenAI: "bg-emerald-100 text-emerald-700",
  Google: "bg-blue-100 text-blue-700",
  Canva: "bg-purple-100 text-purple-700",
  Adobe: "bg-red-100 text-red-700",
  Freepik: "bg-teal-100 text-teal-700",
  미리캔버스: "bg-cyan-100 text-cyan-700",
  망고보드: "bg-yellow-100 text-yellow-700",
  "Getty Images": "bg-stone-100 text-stone-700",
  Shutterstock: "bg-red-100 text-red-700",
  "Adobe Stock": "bg-orange-100 text-orange-700",
  ElevenLabs: "bg-violet-100 text-violet-700",
  Suno: "bg-pink-100 text-pink-700",
  "Meshy·Tripo3D": "bg-lime-100 text-lime-700",
  산돌: "bg-sky-100 text-sky-700",
  윤디자인: "bg-indigo-100 text-indigo-700",
  눈누: "bg-rose-100 text-rose-700",
  Monotype: "bg-slate-100 text-slate-700",
};

const CATEGORY_COLORS: Record<string, string> = {
  "AI모델": "bg-indigo-50 text-indigo-600",
  "디자인툴": "bg-pink-50 text-pink-600",
  "3D AI": "bg-lime-50 text-lime-600",
  "이미지": "bg-stone-50 text-stone-600",
  "폰트": "bg-sky-50 text-sky-600",
};

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  const companyColor = COMPANY_COLORS[article.company] ?? "bg-gray-100 text-gray-600";
  const categoryColor = CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-600";

  return (
    <Link href={`/article/${article.slug}`} className="block group">
      <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200 p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${companyColor}`}>
            {article.company}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColor}`}>
            {article.category}
          </span>
        </div>

        <h2 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">
          {article.title}
        </h2>

        <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">
          {article.summary}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <time className="text-xs text-gray-400">{formatDate(article.date)}</time>
          <span className="text-xs text-brand-600 font-medium group-hover:underline">자세히 보기 →</span>
        </div>
      </article>
    </Link>
  );
}
