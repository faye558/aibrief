import Link from "next/link";
import { getAllArticles, formatDate } from "@/lib/articles";

const COMPANY_COLORS: Record<string, string> = {
  Anthropic: "bg-orange-100 text-orange-700 border-orange-200",
  OpenAI: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Google: "bg-blue-100 text-blue-700 border-blue-200",
  Canva: "bg-purple-100 text-purple-700 border-purple-200",
  Adobe: "bg-red-100 text-red-700 border-red-200",
  Freepik: "bg-teal-100 text-teal-700 border-teal-200",
  미리캔버스: "bg-cyan-100 text-cyan-700 border-cyan-200",
  망고보드: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Getty Images": "bg-stone-100 text-stone-700 border-stone-200",
  Shutterstock: "bg-red-100 text-red-700 border-red-200",
  "Adobe Stock": "bg-orange-100 text-orange-700 border-orange-200",
  ElevenLabs: "bg-violet-100 text-violet-700 border-violet-200",
  Suno: "bg-pink-100 text-pink-700 border-pink-200",
  "Meshy·Tripo3D": "bg-lime-100 text-lime-700 border-lime-200",
  산돌: "bg-sky-100 text-sky-700 border-sky-200",
  윤디자인: "bg-indigo-100 text-indigo-700 border-indigo-200",
  눈누: "bg-rose-100 text-rose-700 border-rose-200",
  Monotype: "bg-slate-100 text-slate-700 border-slate-200",
};

const COMPANY_DOT: Record<string, string> = {
  Anthropic: "bg-orange-400",
  OpenAI: "bg-emerald-400",
  Google: "bg-blue-400",
  Canva: "bg-purple-400",
  Adobe: "bg-red-400",
  Freepik: "bg-teal-400",
  미리캔버스: "bg-cyan-400",
  망고보드: "bg-yellow-400",
  "Getty Images": "bg-stone-400",
  Shutterstock: "bg-red-400",
  "Adobe Stock": "bg-orange-400",
  ElevenLabs: "bg-violet-400",
  Suno: "bg-pink-400",
  "Meshy·Tripo3D": "bg-lime-400",
  산돌: "bg-sky-400",
  윤디자인: "bg-indigo-400",
  눈누: "bg-rose-400",
  Monotype: "bg-slate-400",
};

function groupByMonth(articles: ReturnType<typeof getAllArticles>) {
  const map: Record<string, typeof articles> = {};
  for (const a of articles) {
    const key = a.date.slice(0, 7); // "2026-04"
    if (!map[key]) map[key] = [];
    map[key].push(a);
  }
  return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
}

function formatMonth(ym: string) {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month)}월`;
}

export default function TimelinePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category ?? "전체";
  const allArticles = getAllArticles().sort((a, b) => b.date.localeCompare(a.date));
  const filtered =
    category === "전체"
      ? allArticles
      : allArticles.filter((a) => a.category === category);

  const grouped = groupByMonth(filtered);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">타임라인</h1>
        <p className="text-gray-500 text-sm">AI·디자인툴 업계 전체 흐름을 날짜순으로 한눈에</p>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2 mb-10">
        {["전체", "AI모델", "디자인툴", "3D AI", "이미지", "폰트"].map((cat) => (
          <a
            key={cat}
            href={cat === "전체" ? "/timeline" : `/timeline?category=${cat}`}
            className={`px-4 py-2 rounded-full text-sm font-bold tracking-tight transition-all ${
              category === cat
                ? "bg-brand-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            {cat}
          </a>
        ))}

        {/* 범례 */}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {Object.entries(COMPANY_DOT).map(([co, dot]) => (
            <span key={co} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              {co}
            </span>
          ))}
        </div>
      </div>

      {/* 타임라인 */}
      <div className="relative">
        {/* 세로 축선 */}
        <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gray-200" />

        {grouped.map(([ym, articles]) => (
          <div key={ym} className="mb-10">
            {/* 월 레이블 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-[80px] text-right">
                <span className="text-sm font-extrabold text-gray-700 tracking-tight">
                  {formatMonth(ym)}
                </span>
              </div>
              <div className="relative z-10 w-4 h-4 rounded-full bg-gray-300 border-2 border-white shadow-sm flex items-center justify-center ml-[-2px]">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
              </div>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* 해당 월 기사들 */}
            <div className="space-y-3 pl-[108px]">
              {articles.map((article) => {
                const dot = COMPANY_DOT[article.company] ?? "bg-gray-400";
                const chip = COMPANY_COLORS[article.company] ?? "bg-gray-100 text-gray-600 border-gray-200";
                return (
                  <div key={article.id} className="relative">
                    {/* 축선에서 카드로 연결하는 수평선 */}
                    <div className="absolute left-[-20px] top-[18px] w-4 h-px bg-gray-300" />
                    {/* 축선 위의 도트 */}
                    <div className={`absolute left-[-28px] top-[12px] w-3 h-3 rounded-full ${dot} border-2 border-white shadow-sm z-10`} />

                    <Link href={`/article/${article.slug}`} className="group block">
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${chip}`}>
                                {article.company}
                              </span>
                              <span className="text-xs text-gray-400">{formatDate(article.date)}</span>
                              {(() => {
                                const catStyles: Record<string, string> = {
                                  "AI모델":  "bg-indigo-100 text-indigo-700 font-bold",
                                  "디자인툴": "bg-pink-100 text-pink-700 font-bold",
                                  "3D AI":   "bg-lime-100 text-lime-700 font-bold",
                                  "이미지":  "bg-amber-100 text-amber-700 font-bold",
                                  "폰트":    "bg-sky-100 text-sky-700 font-bold",
                                };
                                const s = catStyles[article.category];
                                return s ? (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${s}`}>
                                    {article.category}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <p className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug line-clamp-2">
                              {article.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {article.summary}
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-400 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">해당 카테고리의 기사가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
