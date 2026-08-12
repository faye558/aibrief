"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GlobalNav from "./GlobalNav";
import MarketStrip from "./MarketStrip";
import type { Article as RawArticle } from "@/app/page";

// ── 카테고리 매핑 ──────────────────────────────
const CAT_MAP: Record<string, string> = {
  "AI모델": "ai",
  "AI":     "ai",
  "3D AI":  "ai",
  "디자인툴": "design",
  "폰트":    "design",
  "이미지":  "design",
  "UX":     "ux",
  "테크":     "tech",
  "테크블로그": "tech",
};

function mapCategory(raw: string): string {
  return CAT_MAP[raw] ?? "ai";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function sourceInitial(name: string): string {
  const map: Record<string, string> = {
    "Anthropic": "An", "OpenAI": "OA", "Google": "G", "Adobe": "Ad",
    "Canva": "Ca", "Freepik": "Fr", "Monotype": "Mo", "ElevenLabs": "EL",
    "망고보드": "망", "미리캔버스": "미", "산돌": "산", "눈누": "눈",
    "윤디자인": "윤", "Shutterstock": "SS", "비비트리": "비", "유토이미지": "유",
    "Suno": "Su", "Meshy·Tripo3D": "3D", "AI·IT": "AI",
  };
  return map[name] ?? name.slice(0, 2);
}

// ── UI 카테고리 목록 ───────────────────────────
const CATEGORIES = [
  { id: "all",    label: "전체",   icon: "⚡" },
  { id: "ai",     label: "AI",     icon: "◉" },
  { id: "design", label: "디자인", icon: "✦" },
  { id: "ux",     label: "UX",     icon: "◎" },
  { id: "tech",   label: "테크",   icon: "⌨" },
];

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  ai:     { bg: "var(--tag-ai-bg)",       color: "var(--tag-ai)" },
  ux:     { bg: "var(--tag-ux-bg)",       color: "var(--tag-ux)" },
  tech:   { bg: "var(--tag-tech-bg)",     color: "var(--tag-tech)" },
  design: { bg: "var(--tag-design-bg)",   color: "var(--tag-design)" },
};

// 회사별 pill 색상 — 다크 톤에 맞게 조정
const COMPANY_COLORS: Record<string, { bg: string; color: string }> = {
  "OpenAI":      { bg: "rgba(16,163,127,0.15)",  color: "#10A37F" },
  "Anthropic":   { bg: "rgba(210,105,30,0.15)",   color: "#D2691E" },
  "Google":      { bg: "rgba(66,133,244,0.15)",   color: "#4285F4" },
  "Adobe":       { bg: "rgba(255,0,0,0.12)",       color: "#FF4444" },
  "Canva":       { bg: "rgba(0,196,204,0.15)",     color: "#00C4CC" },
  "Figma":       { bg: "rgba(162,89,255,0.15)",    color: "#A259FF" },
  "Meta":        { bg: "rgba(24,119,242,0.15)",    color: "#1877F2" },
  "Microsoft":   { bg: "rgba(0,120,212,0.15)",     color: "#0078D4" },
  "토스":        { bg: "rgba(82,110,255,0.15)",    color: "#526EFF" },
  "카카오":      { bg: "rgba(254,229,0,0.15)",     color: "#C9A800" },
  "네이버":      { bg: "rgba(3,199,90,0.15)",      color: "#03C75A" },
  "당근":        { bg: "rgba(255,107,0,0.15)",     color: "#FF6B00" },
  "우아한형제들": { bg: "rgba(44,196,78,0.15)",    color: "#2CC44E" },
};

function getCompanyStyle(company: string): { bg: string; color: string } {
  return COMPANY_COLORS[company] ?? { bg: "rgba(132,132,156,0.12)", color: "var(--text-muted)" };
}

const GRADIENTS = [
  "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #0d0520 100%)",
  "linear-gradient(135deg, #0d1f2d 0%, #0a3d62 50%, #051219 100%)",
  "linear-gradient(135deg, #1a0a1a 0%, #3d1a5c 50%, #0d0514 100%)",
  "linear-gradient(135deg, #0a1a1a 0%, #0d4a4a 50%, #051414 100%)",
  "linear-gradient(135deg, #1a100d 0%, #4a2010 50%, #140a05 100%)",
  "linear-gradient(135deg, #0d1a0d 0%, #1a4a1a 50%, #051405 100%)",
];

// ── 서브컴포넌트 ───────────────────────────────
function Tag({ uiCat }: { uiCat: string }) {
  const style = TAG_STYLES[uiCat] ?? TAG_STYLES.ai;
  const label: Record<string, string> = {
    ai: "AI", ux: "UX", tech: "테크", design: "디자인", blog: "기업블로그",
  };
  return (
    <span style={{
      background: style.bg, color: style.color,
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
      padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase",
    }}>
      {label[uiCat] ?? uiCat}
    </span>
  );
}

function SourceBadge({ initial, name }: { initial: string; name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <div style={{
        width: "22px", height: "22px", borderRadius: "6px",
        background: "var(--accent-dim)", border: "1px solid var(--border-hover)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "10px", fontWeight: 700, color: "var(--accent-hover)", flexShrink: 0,
      }}>
        {initial.slice(0, 2)}
      </div>
      <div>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>{name}</span>
        <span style={{ fontSize: "10px", color: "var(--text-faint)", marginLeft: "4px" }}>원문</span>
      </div>
    </div>
  );
}

interface CardArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content?: string;
  uiCategory: string;
  sourceName: string;
  sourceInitial: string;
  timeAgo: string;
  gradient: string;
  sourceUrl: string | null;
  tags: string[];
  type?: string;
  isNew?: "today" | "new" | false;
}

const FEATURED_SOURCES = new Set([
  "Anthropic", "OpenAI", "Google", "Microsoft", "Meta", "Apple",
  "ChatGPT", "Claude", "Gemini", "Figma", "Canva", "Adobe",
]);

function isFeatured(article: CardArticle): boolean {
  if (article.type === "outlink") return true;
  return FEATURED_SOURCES.has(article.sourceName) ||
    article.tags.some((t) => FEATURED_SOURCES.has(t));
}

// 카드 목록을 featured(1단) / batch(2단) 블록으로 분리
function groupCards(cards: CardArticle[]): ({ type: "featured"; card: CardArticle } | { type: "batch"; cards: CardArticle[] })[] {
  const result: ({ type: "featured"; card: CardArticle } | { type: "batch"; cards: CardArticle[] })[] = [];
  let batch: CardArticle[] = [];
  for (const card of cards) {
    if (isFeatured(card)) {
      if (batch.length) { result.push({ type: "batch", cards: batch }); batch = []; }
      result.push({ type: "featured", card });
    } else {
      batch.push(card);
    }
  }
  if (batch.length) result.push({ type: "batch", cards: batch });
  return result;
}

const CAT_ACCENT: Record<string, string> = {
  ai:     "#E879F9",
  ux:     "#38BDF8",
  tech:   "#34D399",
  design: "#A78BFA",
  blog:   "#F47287",
};

function ArticleCard({ article, large }: { article: CardArticle; large?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const accent = CAT_ACCENT[article.uiCategory] ?? "#7C6FF7";

  return (
    <a
      href={article.content ? `/article/${article.slug}` : (article.sourceUrl ?? `/article/${article.slug}`)}
      target={article.content ? undefined : "_blank"}
      rel={article.content ? undefined : "noopener noreferrer"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column",
        background: hovered
          ? `linear-gradient(160deg, ${accent}0D 0%, var(--surface-hover) 40%)`
          : `linear-gradient(160deg, ${accent}08 0%, var(--surface) 40%)`,
        border: `1px solid ${hovered ? accent + "55" : "var(--border)"}`,
        borderRadius: "14px", padding: "0",
        textDecoration: "none", transition: "all 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 8px 28px ${accent}20` : "none",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 좌측 컬러 바 */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: "3px", background: accent,
        opacity: hovered ? 1 : 0.5,
        transition: "opacity 0.18s",
        borderRadius: "14px 0 0 14px",
      }} />

      <div style={{ padding: large ? "24px 24px 24px 28px" : "20px 20px 20px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* 상단: 태그 pill(s) + 카테고리 pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {article.tags.slice(0, 2).map((tag) => {
            const catKey = CAT_MAP[tag];
            const cs = catKey
              ? { bg: TAG_STYLES[catKey].bg, color: TAG_STYLES[catKey].color }
              : getCompanyStyle(tag);
            return (
              <span key={tag} style={{
                fontSize: "12px", fontWeight: 600, padding: "4px 10px",
                borderRadius: "20px", background: cs.bg, color: cs.color,
                cursor: "pointer",
              }}>
                {tag}
              </span>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            {article.isNew === "today" && (
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 7px",
                borderRadius: "20px", background: "rgba(251,146,60,0.15)", color: "#FB923C",
                letterSpacing: "0.04em",
              }}>TODAY</span>
            )}
            {article.isNew === "new" && (
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "2px 7px",
                borderRadius: "20px", background: "rgba(63,185,80,0.15)", color: "#3fb950",
                letterSpacing: "0.04em",
              }}>NEW</span>
            )}
            <Tag uiCat={article.uiCategory} />
          </div>
        </div>

        {/* 제목 */}
        <h3 style={{
          fontSize: large ? "20px" : "17px", fontWeight: 700, lineHeight: 1.5,
          color: hovered ? "#fff" : "var(--text)",
          marginBottom: "10px",
          display: "-webkit-box", WebkitLineClamp: large ? 3 : 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", transition: "color 0.15s ease",
          letterSpacing: "-0.4px",
        }}>
          {article.title}
        </h3>

        {/* 요약 — 그리드 카드는 1줄만, featured는 2줄 */}
        <p style={{
          fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7,
          marginBottom: "18px", flex: 1,
          display: "-webkit-box", WebkitLineClamp: large ? 2 : 1, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {article.summary}
        </p>

        {/* 하단: 날짜 + 자세히 보기 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>{article.timeAgo}</span>
          <span style={{
            fontSize: "12px", fontWeight: 600, color: accent,
            opacity: hovered ? 1 : 0.7, transition: "opacity 0.15s",
          }}>
            {article.type === "outlink" ? "원문 보기 →" : "자세히 보기 →"}
          </span>
        </div>
      </div>
    </a>
  );
}

const LABEL_TO_ID: Record<string, string> = {
  "AI": "ai", "디자인": "design", "UX": "ux", "테크": "tech",
};

// ── 메인 컴포넌트 ──────────────────────────────
declare global { interface Window { gtag?: (...args: unknown[]) => void } }

export default function FeedPage({ articles, categoryFilter }: { articles: RawArticle[]; categoryFilter?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(() => categoryFilter ? (LABEL_TO_ID[categoryFilter] ?? "all") : "all");

  const handleCategoryClick = useCallback((catId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveCategory(catId);
    const href = catId === "all" ? "/" : `/category/${catId}`;
    router.push(href, { scroll: false });
    window.gtag?.("event", "category_tab_click", { category: catId });
  }, [router]);
  const [activeTag, setActiveTag] = useState<string | null>(() => searchParams.get("tag"));
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const tag = searchParams.get("tag");
    if (tag) setActiveTag(tag);
  }, [searchParams]);

  function clearFilters() {
    setActiveCategory("all");
    setActiveTag(null);
    setActiveSource(null);
    setSearchQuery("");
  }

  // 실제 데이터 변환
  const cards: CardArticle[] = articles.map((a, i) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    content: a.content,
    uiCategory: mapCategory(a.category),
    sourceName: a.sourceName,
    sourceInitial: sourceInitial(a.company),
    timeAgo: formatDate(a.date),
    gradient: GRADIENTS[i % GRADIENTS.length],
    sourceUrl: a.sourceUrl,
    tags: a.tags ?? [],
    type: a.type,
    isNew: (() => {
      const diff = (Date.now() - new Date(a.date).getTime()) / 86400000;
      if (diff < 1) return "today" as const;
      if (diff <= 3) return "new" as const;
      return false as const;
    })(),
  }));

  // 필터 적용: 카테고리 → 태그 → 소스 → 검색어 → 정렬
  const filtered = cards
    .filter((a) => activeCategory === "all" || a.uiCategory === activeCategory)
    .filter((a) => !activeTag || a.tags.includes(activeTag))
    .filter((a) => !activeSource || a.sourceName === activeSource)
    .filter((a) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.sourceName.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const da = new Date(articles.find(x => x.id === a.id)?.date ?? 0).getTime();
      const db = new Date(articles.find(x => x.id === b.id)?.date ?? 0).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

  // NEW 섹션: 3일 이내 기사
  const newCutoff = Date.now() - 3 * 86400000;
  const newCards = filtered.filter((a) => new Date(articles.find(x => x.id === a.id)?.date ?? 0).getTime() > newCutoff);
  const olderCards = filtered.filter((a) => !newCards.includes(a));

  const featured = filtered[0];
  const rest = filtered.slice(1);

  // 우측 레일 — 태그 집계 (관심사 태그 우선 고정)
  const PRIORITY_TAGS = [
    "AI워크플로우", "팀협업", "AI도입", "AI에이전트", "GEO", "AI검색",
    "vibe코딩", "AI마케팅", "개발자역할", "AI시대", "llms.txt", "AI인용",
  ];
  const tagCounts: Record<string, number> = {};
  articles.forEach((a) => a.tags?.forEach((t) => { tagCounts[t] = (tagCounts[t] ?? 0) + 1; }));
  const priorityTags = PRIORITY_TAGS.filter((t) => tagCounts[t]).map((t) => [t, tagCounts[t]] as [string, number]);
  const otherTags = Object.entries(tagCounts)
    .filter(([t]) => !PRIORITY_TAGS.includes(t))
    .sort((a, b) => b[1] - a[1]);
  const topTags = [...priorityTags, ...otherTags].slice(0, 8);

  // 우측 레일 — 소스 집계
  const srcCounts: Record<string, number> = {};
  articles.forEach((a) => { srcCounts[a.sourceName] = (srcCounts[a.sourceName] ?? 0) + 1; });
  const topSources = Object.entries(srcCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const hasFilter = activeCategory !== "all" || activeTag || activeSource;

  return (
    <div className="page-shell">
      <GlobalNav />
      <MarketStrip />

      {/* 모바일 카테고리 스트립 */}
      <div className="mobile-cats">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const href = cat.id === "all" ? "/" : `/category/${cat.id}`;
          return (
            <a key={cat.id} href={href} onClick={(e) => handleCategoryClick(cat.id, e)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: "20px", border: "none",
              cursor: "pointer", textDecoration: "none",
              background: isActive ? "var(--accent-dim)" : "var(--surface)",
              color: isActive ? "var(--accent-hover)" : "var(--text-muted)",
              fontSize: "13px", fontWeight: isActive ? 600 : 400,
              whiteSpace: "nowrap", transition: "all 0.12s ease",
            }}>
              {cat.label}
            </a>
          );
        })}
      </div>

      <div className="feed-layout">
        {/* ── 좌 사이드바 ── */}
        <aside className="left-sidebar">
          <nav style={{ padding: "12px", flex: 1 }}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const href = cat.id === "all" ? "/" : `/category/${cat.id}`;
              return (
                <a key={cat.id} href={href} onClick={(e) => handleCategoryClick(cat.id, e)} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", padding: "8px 10px", borderRadius: "8px", border: "none",
                  cursor: "pointer", textDecoration: "none",
                  background: isActive ? "var(--accent-dim)" : "transparent",
                  color: isActive ? "var(--accent-hover)" : "var(--text-muted)",
                  fontSize: "13px", fontWeight: isActive ? 600 : 400,
                  textAlign: "left", transition: "all 0.12s ease", marginBottom: "2px",
                }}>
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>{cat.icon}</span>
                  {cat.label}
                </a>
              );
            })}
          </nav>
          <div style={{ padding: "0 12px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <a href="mailto:fanfaye1@gmail.com" style={{ fontSize: "11px", color: "var(--text-faint)", textDecoration: "none", opacity: 0.6 }}>문의</a>
            <a href="/privacy" style={{ fontSize: "11px", color: "var(--text-faint)", textDecoration: "none", opacity: 0.6 }}>개인정보처리방침</a>
          </div>
        </aside>

        {/* ── 메인 피드 ── */}
        <main className="feed-main">
          {/* 검색창 */}
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="var(--text-faint)" strokeWidth="1.5"/><line x1="8.5" y1="8.5" x2="12.5" y2="12.5" stroke="var(--text-faint)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input
              type="text"
              placeholder="콘텐츠 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", fontSize: "16px" }}>×</button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasFilter ? "12px" : "20px" }}>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.4px" }}>
                {searchQuery ? `"${searchQuery}" 검색 결과` : activeTag ? `#${activeTag}` : activeSource ? activeSource : CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "전체"}
              </h1>
              <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "2px" }}>
                {filtered.length}개 아티클
              </p>
            </div>
            <div
              onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
              style={{ fontSize: "12px", color: "var(--text-faint)", background: "var(--surface)", border: "1px solid var(--border)", padding: "5px 12px", borderRadius: "20px", cursor: "pointer" }}
            >
              {sortOrder === "newest" ? "최신순 ↓" : "오래된순 ↑"}
            </div>
          </div>

          {/* 활성 필터 뱃지 */}
          {hasFilter && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {activeCategory !== "all" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--accent-dim)", color: "var(--accent-hover)", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                  <button onClick={() => setActiveCategory("all")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              {activeTag && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(56,189,248,0.1)", color: "#38BDF8", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
                  #{activeTag}
                  <button onClick={() => setActiveTag(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              {activeSource && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(167,139,250,0.1)", color: "#A78BFA", fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>
                  {activeSource}
                  <button onClick={() => setActiveSource(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                </span>
              )}
              <button onClick={clearFilters} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-faint)", fontSize: "12px", padding: "4px 10px", borderRadius: "20px", cursor: "pointer" }}>
                전체 초기화
              </button>
            </div>
          )}

          {/* NEW 섹션 */}
          {newCards.length > 0 && (
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <span style={{
                  fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em",
                  color: "#fff", background: "var(--accent)",
                  padding: "3px 8px", borderRadius: "5px",
                }}>NEW</span>
                <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>최근 3일 · {newCards.length}개</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>
              {/* NEW 섹션은 1단 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {newCards.map((a) => (
                  <ArticleCard key={a.id} article={a} large />
                ))}
              </div>
            </div>
          )}

          {/* 쿠팡 배너 1 — NEW 섹션 직후 */}
          <div style={{ margin: "4px 0 20px" }}>
            <a href="https://link.coupang.com/a/f76O38Y4WW" target="_blank" rel="noreferrer" referrerPolicy="unsafe-url">
              <img src="https://ads-partners.coupang.com/banners/1016464?trackingCode=AF5585556&subId=&traceId=V0-301-f5c692db558def48-I1016464&w=728&h=90" alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }} />
            </a>
          </div>

          {/* 이전 아티클 */}
          {olderCards.length > 0 && (
            <div>
              {newCards.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-faint)", fontWeight: 500 }}>이전 아티클</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {groupCards(olderCards).map((block, i) => (
                  <div key={`wrap-${i}`}>
                    {i === 2 && (
                      <div style={{ marginBottom: "20px" }}>
                        <a href="https://link.coupang.com/a/f76O38Y4WW" target="_blank" rel="noreferrer" referrerPolicy="unsafe-url">
                          <img src="https://ads-partners.coupang.com/banners/1016464?trackingCode=AF5585556&subId=&traceId=V0-301-f5c692db558def48-I1016464&w=728&h=90" alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }} />
                        </a>
                      </div>
                    )}
                    {i === 4 && (
                      <div style={{ marginBottom: "20px" }}>
                        <a href="https://link.coupang.com/a/f76U5O21uK" target="_blank" rel="noreferrer" referrerPolicy="unsafe-url">
                          <img src="https://ads-partners.coupang.com/banners/1016467?trackingCode=AF5585556&subId=&traceId=V0-301-969b06e95b87326d-I1016467&w=728&h=90" alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }} />
                        </a>
                      </div>
                    )}
                    {block.type === "featured" ? (
                      <ArticleCard key={`f-${block.card.id}`} article={block.card} large />
                    ) : (
                      <div key={`b-${i}-${block.cards[0]?.id}`} className="card-grid">
                        {block.cards.map((a) => <ArticleCard key={a.id} article={a} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── 우 레일 ── */}
        <aside className="right-rail">
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "14px" }}>
            인기 태그
          </p>
          {topTags.map(([tag, count], i) => (
            <div key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "opacity 0.12s", opacity: activeTag && activeTag !== tag ? 0.4 : 1 }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-faint)", fontVariantNumeric: "tabular-nums", width: "20px", flexShrink: 0 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: activeTag === tag ? "#38BDF8" : "var(--text)", marginBottom: "2px" }}>#{tag}</p>
                <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{count}개 아티클</p>
              </div>
              {activeTag === tag && <span style={{ fontSize: "10px", color: "#38BDF8" }}>✓</span>}
            </div>
          ))}

          <div style={{ marginTop: "20px" }}>
            <iframe src="https://coupa.ng/coHLmp" width="100%" height="36" frameBorder={0} scrolling="no" referrerPolicy="unsafe-url" style={{ display: "block", borderRadius: "6px" }} />
          </div>

        </aside>
      </div>
    </div>
  );
}
