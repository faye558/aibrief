import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getArticleBySlug, getAllArticles, formatDate } from "@/lib/articles";
import AdBanner from "@/components/AdBanner";
import CoupangBanner from "@/components/CoupangBanner";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

const SITE_URL = "https://aibrief.toolr.kr";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  const url = `${SITE_URL}/article/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: "article",
      url,
      siteName: "AI Brief",
      locale: "ko_KR",
      publishedTime: article.date,
      tags: article.tags,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: ["/og-default.png"],
    },
  };
}

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

function renderContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("## ")) {
      return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">{line.slice(3)}</h2>;
    }
    if (line.startsWith("- ")) {
      return <li key={i} className="text-gray-700 leading-relaxed">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
    }
    if (line === "") return <br key={i} />;

    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} className="text-gray-700 leading-relaxed mb-4">
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-bold text-gray-900">{part}</strong> : part
        )}
      </p>
    );
  });
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const companyColor = COMPANY_COLORS[article.company] ?? "bg-gray-100 text-gray-600";
  const relatedArticles = getAllArticles()
    .filter((a) => a.slug !== article.slug && (a.company === article.company || a.category === article.category))
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Organization", name: "AI Brief", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "AI Brief",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-default.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/article/${article.slug}` },
    keywords: article.tags.join(", "),
    articleSection: article.category,
    inLanguage: "ko-KR",
    ...(article.sourceUrl ? { url: article.sourceUrl } : {}),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex gap-8">
        {/* 본문 */}
        <article className="flex-1 min-w-0">
          {/* 브레드크럼 */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-brand-600 transition-colors">홈</Link>
            <span>/</span>
            <Link href={`/?company=${article.company}`} className="hover:text-brand-600 transition-colors">{article.company}</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{article.title}</span>
          </nav>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {/* 태그 */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${companyColor}`}>{article.company}</span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600">{article.category}</span>
            </div>

            {/* 제목 */}
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-4">
              {article.title}
            </h1>

            {/* 요약 */}
            <div className="bg-brand-50 border-l-4 border-brand-500 rounded-r-lg p-4 mb-6">
              <p className="text-sm font-medium text-brand-800 leading-relaxed">{article.summary}</p>
            </div>

            <time className="text-sm text-gray-400 mb-6 block">{formatDate(article.date)}</time>


            {/* 본문 */}
            <div className="space-y-1">
              {renderContent(article.content)}
            </div>

            {/* 태그 목록 */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* 출처 링크 */}
            {(article.sources && article.sources.length > 0) || article.sourceUrl ? (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">출처 및 참고 기사</span>
                </div>
                <ul className="space-y-1.5">
                  {article.sources && article.sources.length > 0
                    ? article.sources.map((s, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                            {s.name}
                          </a>
                        </li>
                      ))
                    : article.sourceUrl && (
                        <li className="flex items-center gap-2 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                          <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                            {article.sourceName ?? article.sourceUrl}
                          </a>
                        </li>
                      )}
                </ul>
              </div>
            ) : null}

            {/* 쿠팡 파트너스 배너 — 본문 끝 / 커뮤니티 반응 사이 */}
            <div className="flex justify-center mt-6">
              <CoupangBanner />
            </div>

            {/* 커뮤니티 반응 */}
            {(article.communityReaction || (article.communityLinks && article.communityLinks.length > 0)) && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">커뮤니티 반응</span>
                  <span className="text-xs text-gray-400 bg-gray-200 rounded px-1.5 py-0.5">AI 예상</span>
                </div>
                {article.communityReaction && (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-3">{article.communityReaction}</p>
                )}
                {article.communityLinks && article.communityLinks.length > 0 && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-400 mb-2">실제 반응 확인하기 →</p>
                    <div className="flex flex-wrap gap-2">
                      {article.communityLinks.map((cl, i) => (
                        <a
                          key={i}
                          href={cl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-brand-600 hover:border-brand-400 hover:bg-brand-50 transition-colors"
                        >
                          {cl.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* 본문 하단 광고 */}
          <AdBanner slot="content-bottom" className="mt-8" />

          {/* 관련 기사 */}
          {relatedArticles.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">관련 기사</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map((a) => (
                  <Link key={a.slug} href={`/article/${a.slug}`} className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-4 transition-all">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${COMPANY_COLORS[a.company] ?? "bg-gray-100 text-gray-600"}`}>{a.company}</span>
                    <p className="mt-2 text-sm font-semibold text-gray-800 group-hover:text-brand-600 line-clamp-2 transition-colors">{a.title}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatDate(a.date)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* 사이드바 */}
        <aside className="hidden lg:block w-[300px] shrink-0">
          <div className="sticky top-32 space-y-6">
            <AdBanner slot="sidebar" />
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-3">회사별 뉴스</h3>
              <ul className="space-y-2">
                {["Anthropic", "OpenAI", "Google", "Canva", "Adobe", "Freepik", "미리캔버스", "망고보드", "Getty Images", "Shutterstock", "Adobe Stock", "ElevenLabs", "Suno", "Meshy·Tripo3D", "산돌", "윤디자인", "눈누", "Monotype"].map((co) => (
                  <li key={co}>
                    <Link href={`/?company=${co}`} className="flex items-center justify-between text-sm text-gray-600 hover:text-brand-600 transition-colors">
                      <span>{co}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
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
