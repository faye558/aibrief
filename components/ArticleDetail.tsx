"use client";

import Link from "next/link";
import GlobalNav from "./GlobalNav";
import type { Article } from "@/app/page";

const CAT_LABEL: Record<string, string> = {
  "AI모델": "AI", "AI": "AI", "3D AI": "AI",
  "디자인툴": "디자인", "폰트": "디자인", "이미지": "디자인",
  "UX": "UX", "테크": "테크", "테크블로그": "기업블로그",
};

const CAT_COLOR: Record<string, { bg: string; color: string }> = {
  "AI모델": { bg: "rgba(232,121,249,0.1)", color: "#E879F9" },
  "AI":     { bg: "rgba(232,121,249,0.1)", color: "#E879F9" },
  "3D AI":  { bg: "rgba(232,121,249,0.1)", color: "#E879F9" },
  "디자인툴": { bg: "rgba(167,139,250,0.1)", color: "#A78BFA" },
  "폰트":    { bg: "rgba(167,139,250,0.1)", color: "#A78BFA" },
  "이미지":  { bg: "rgba(167,139,250,0.1)", color: "#A78BFA" },
  "UX":     { bg: "rgba(56,189,248,0.1)", color: "#38BDF8" },
  "테크":   { bg: "rgba(52,211,153,0.1)", color: "#34D399" },
  "테크블로그": { bg: "rgba(244,114,135,0.1)", color: "#F47287" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function parseSummary(text: string): { brief: string; points: string[]; meaning: string | null } {
  const sentences = text
    .split(/(?<=[.。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return { brief: text, points: [], meaning: null };
  if (sentences.length === 2) return { brief: sentences[0], points: [], meaning: sentences[1] };
  return { brief: sentences[0], points: sentences.slice(1, -1), meaning: sentences[sentences.length - 1] };
}

// content 마크다운 파싱: ## 제목 + 텍스트/불릿 구조
function parseContent(md: string): { heading: string; bullets: string[]; text: string }[] {
  const sections: { heading: string; bullets: string[]; text: string }[] = [];
  const blocks = md.split(/^## /m).filter(Boolean);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const heading = lines[0].trim();
    const body = lines.slice(1).filter(Boolean);
    const bullets = body.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
    const text = body.filter((l) => !l.startsWith("- ")).join(" ").trim();
    sections.push({ heading, bullets, text });
  }
  return sections;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

export default function ArticleDetail({ article, related }: { article: Article; related: Article[] }) {
  const catStyle = CAT_COLOR[article.category] ?? { bg: "rgba(232,121,249,0.1)", color: "#E879F9" };
  const catLabel = CAT_LABEL[article.category] ?? article.category;
  const { brief, points, meaning } = parseSummary(article.summary);
  const contentSections = article.content ? parseContent(article.content) : null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <GlobalNav />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* 뒤로가기 */}
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          color: "var(--text-muted)", fontSize: "13px", textDecoration: "none",
          marginBottom: "28px",
          transition: "color 0.12s",
        }}>
          ← 피드로 돌아가기
        </Link>

        {/* 카테고리 태그 */}
        <div style={{ marginBottom: "14px" }}>
          <span style={{
            background: catStyle.bg, color: catStyle.color,
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
            padding: "4px 10px", borderRadius: "5px",
          }}>
            {catLabel}
          </span>
        </div>

        {/* 제목 */}
        <h1 style={{
          fontSize: "26px", fontWeight: 700, lineHeight: 1.4,
          color: "var(--text)", letterSpacing: "-0.5px", marginBottom: "16px",
        }}>
          {article.title}
        </h1>

        {/* 메타 */}
        <div style={{
          display: "flex", alignItems: "center", gap: "16px",
          marginBottom: "32px", paddingBottom: "24px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "var(--accent-dim)", border: "1px solid var(--border-hover)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 700, color: "var(--accent-hover)",
          }}>
            {article.company.slice(0, 2)}
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{article.sourceName}</p>
            <p style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "1px" }}>{formatDate(article.date)}</p>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ marginBottom: "28px" }}>
          {contentSections ? (
            /* content 있는 기사 — 마크다운 섹션 렌더링 */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {contentSections.map((sec, i) => (
                <div key={i} style={{
                  background: i === 0
                    ? `linear-gradient(135deg, ${catStyle.color}0A 0%, transparent 100%)`
                    : "var(--surface)",
                  border: `1px solid ${i === 0 ? catStyle.color + "30" : "var(--border)"}`,
                  borderRadius: "12px", padding: "20px 24px",
                }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "12px", margin: "0 0 12px",
                    color: i === contentSections!.length - 1 ? "var(--accent-hover)" : i === 0 ? catStyle.color : "var(--text-faint)",
                    textTransform: "uppercase", opacity: i === 0 ? 0.9 : 1 }}>
                    {i === contentSections!.length - 1 ? "큐레이터 노트" : sec.heading}
                  </p>
                  {sec.bullets.length > 0 ? (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                      {sec.bullets.map((b, j) => (
                        <li key={j} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: catStyle.color, flexShrink: 0, marginTop: "7px" }} />
                          <span style={{ fontSize: "15px", lineHeight: 1.65, color: "var(--text-muted)" }}>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: "15px", lineHeight: 1.7, color: "var(--text-muted)" }}>{sec.text}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* content 없는 기사(새 RSS) — 미리보기 한 박스 */
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "24px",
            }}>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "12px" }}>
                미리보기
              </p>
              <p style={{ fontSize: "16px", lineHeight: 1.75, color: "var(--text-muted)" }}>
                {article.summary}
              </p>
            </div>
          )}
        </div>

        {/* 태그 — 클릭하면 피드로 이동해서 해당 태그 필터 */}
        {article.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
            {article.tags.map((tag) => (
              <Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                color: "var(--text-muted)", fontSize: "12px",
                padding: "5px 12px", borderRadius: "20px", textDecoration: "none",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* 출처 및 원문 */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "12px", padding: "20px 24px", marginBottom: "48px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "6px" }}>
              출처
            </p>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>{article.sourceName}</p>
            {article.sourceUrl && (
              <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "3px", wordBreak: "break-all" }}>
                {article.sourceUrl}
              </p>
            )}
          </div>
          {article.sourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "var(--accent)", color: "#fff",
                fontSize: "14px", fontWeight: 600, flexShrink: 0,
                padding: "10px 20px", borderRadius: "10px",
                textDecoration: "none", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
            >
              원문 보기 →
            </a>
          )}
        </div>

        {/* 쿠팡 배너 */}
        <div style={{ marginBottom: "32px" }}>
          <a href="https://link.coupang.com/a/f76O38Y4WW" target="_blank" rel="noreferrer" referrerPolicy="unsafe-url">
            <img src="https://ads-partners.coupang.com/banners/1016464?trackingCode=AF5585556&subId=&traceId=V0-301-f5c692db558def48-I1016464&w=728&h=90" alt="" style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px" }} />
          </a>
        </div>

        {/* 관련 기사 */}
        {related.length > 0 && (
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase", marginBottom: "16px" }}>
              같이 볼만한 기사
            </p>
            <div style={{ display: "grid", gap: "12px" }}>
              {related.map((r) => {
                const cs = CAT_COLOR[r.category] ?? CAT_COLOR["AI모델"];
                return (
                  <Link key={r.slug} href={`/article/${r.slug}`} style={{
                    display: "flex", alignItems: "flex-start", gap: "14px",
                    background: `linear-gradient(135deg, ${cs.color}08 0%, var(--surface) 60%)`,
                    border: `1px solid ${cs.color}30`,
                    borderRadius: "12px", padding: "16px", textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = cs.color + "60"; e.currentTarget.style.background = `linear-gradient(135deg, ${cs.color}15 0%, var(--surface) 60%)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = cs.color + "30"; e.currentTarget.style.background = `linear-gradient(135deg, ${cs.color}08 0%, var(--surface) 60%)`; }}
                  >
                    <div style={{ width: "3px", alignSelf: "stretch", borderRadius: "2px", background: cs.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", lineHeight: 1.45, marginBottom: "6px",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {r.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "11px", color: cs.color, fontWeight: 600 }}>{r.sourceName}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>·</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{timeAgo(r.date)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
