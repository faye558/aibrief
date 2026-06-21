import { Suspense } from "react";
import { getFilteredArticles, getPopularTags } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import FilterBar from "@/components/FilterBar";
import AdBanner from "@/components/AdBanner";
import CoupangBanner from "@/components/CoupangBanner";

interface PageProps {
  searchParams: { company?: string; category?: string; tag?: string };
}

export default function HomePage({ searchParams }: PageProps) {
  const { company, category, tag } = searchParams;
  const articles = getFilteredArticles(company, category, tag);
  const popularTags = getPopularTags(12);

  const pageTitle =
    tag
      ? `#${tag} 기사`
      : company && company !== "전체"
      ? `${company} 뉴스`
      : category && category !== "전체"
      ? `${category} 뉴스`
      : "최신 AI·IT 뉴스";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 히어로 */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1">{pageTitle}</h1>
            <p className="text-gray-500 text-sm">
              {articles.length}개의 기사 · Anthropic, OpenAI, Google, Canva, Adobe 등 주요 AI·IT 기업 소식
            </p>
          </div>

          {/* 필터 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
            <Suspense>
              <FilterBar />
            </Suspense>
          </div>

          {/* 기사 그리드 */}
          {articles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">해당 조건의 기사가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {articles.slice(0, 4).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              {articles.length > 4 && (
                <>
                  {/* 쿠팡 파트너스 배너 — 기사 4개 후 삽입 */}
                  <div className="flex justify-center my-6">
                    <CoupangBanner />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {articles.slice(4).map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* 사이드바 */}
        <aside className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-32 space-y-6">
            {/* 쿠팡 파트너스 배너 */}
            <CoupangBanner />

            {/* 인기 태그 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">인기 태그</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((t) => (
                  <a
                    key={t}
                    href={tag === t ? "/" : `/?tag=${encodeURIComponent(t)}`}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      tag === t
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-700"
                    }`}
                  >
                    #{t}
                  </a>
                ))}
              </div>
            </div>

            {/* 회사 바로가기 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">회사별 뉴스</h3>
              <ul className="space-y-2">
                {["Anthropic", "OpenAI", "Google", "Canva", "Adobe", "Freepik", "미리캔버스", "망고보드", "Getty Images", "Shutterstock", "Adobe Stock", "ElevenLabs", "Suno", "Meshy·Tripo3D", "산돌", "윤디자인", "눈누", "Monotype"].map((co) => (
                  <li key={co}>
                    <a
                      href={`/?company=${co}`}
                      className="flex items-center justify-between text-sm text-gray-600 hover:text-brand-600 transition-colors"
                    >
                      <span>{co}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
