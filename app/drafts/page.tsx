"use client";

import { useState, useCallback } from "react";
import GlobalNav from "@/components/GlobalNav";

interface Draft {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  tags: string[];
  sourceName: string;
  sourceUrl: string | null;
  date: string;
}

const CATEGORIES = ["IT·테크", "AI·머신러닝", "디자인·UX", "업무환경·생산성", "스타트업·비즈니스", "기타"];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  border: "1px solid var(--border)", background: "var(--bg)",
  color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
};

export default function DraftsPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [tab, setTab] = useState<"drafts" | "published">("drafts");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showWrite, setShowWrite] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "", category: "IT·테크", tags: "", sourceName: "", sourceUrl: "" });
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchDrafts = useCallback(async (k: string, t: "drafts" | "published" = "drafts") => {
    setLoading(true);
    const res = await fetch(`/api/drafts?key=${encodeURIComponent(k)}&tab=${t}`);
    if (res.ok) {
      const data = await res.json();
      setDrafts(data);
      setAuthed(true);
    } else {
      setMsg("키가 틀렸어요.");
    }
    setLoading(false);
  }, []);

  async function approve(id: string) {
    await fetch(`/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDrafts((d) => d.filter((a) => a.id !== id));
    setMsg("✓ 발행됨");
    setTimeout(() => setMsg(""), 2000);
  }

  async function toggleHidden(id: string, hide: boolean) {
    await fetch(`/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: hide ? "hide" : "unhide" }),
    });
    setDrafts((d) => d.filter((a) => a.id !== id));
    setMsg(hide ? "숨김 처리됨" : "복원됨");
    setTimeout(() => setMsg(""), 2000);
  }

  async function remove(id: string) {
    await fetch(`/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDrafts((d) => d.filter((a) => a.id !== id));
    setMsg("🗑 삭제됨");
    setTimeout(() => setMsg(""), 2000);
  }

  async function generateDraft() {
    if (!topic.trim()) return;
    setGenerating(true);
    const res = await fetch(`/api/generate?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (res.ok) {
      const data = await res.json();
      setForm({
        title: data.title ?? "",
        summary: data.summary ?? "",
        content: data.content ?? "",
        category: data.category ?? "IT·테크",
        tags: (data.tags ?? []).join(", "),
        sourceName: data.sourceName ?? "직접 작성",
        sourceUrl: "",
      });
      setMsg("✓ 초안 생성됨");
      setTimeout(() => setMsg(""), 2000);
    } else {
      setMsg("생성 실패");
    }
    setGenerating(false);
  }

  async function saveArticle() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        sourceUrl: form.sourceUrl || null,
      }),
    });
    if (res.ok) {
      setMsg("✓ 초안 저장됨");
      setForm({ title: "", summary: "", content: "", category: "IT·테크", tags: "", sourceName: "", sourceUrl: "" });
      setShowWrite(false);
      fetchDrafts(key);
    } else {
      setMsg("저장 실패");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", width: "320px" }}>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>비밀번호</p>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchDrafts(key)}
            style={inputStyle}
          />
          {msg && <p style={{ fontSize: "12px", color: "#F47287", marginTop: "8px" }}>{msg}</p>}
          <button onClick={() => fetchDrafts(key)} style={{ marginTop: "12px", width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            {loading ? "확인 중..." : "입장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <GlobalNav />
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>콘텐츠 관리</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {msg && <span style={{ fontSize: "13px", color: "var(--accent-hover)", fontWeight: 600 }}>{msg}</span>}
            <button onClick={() => setShowWrite(!showWrite)} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {showWrite ? "닫기" : "+ 새 글"}
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--surface)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
          {(["drafts", "published"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); fetchDrafts(key, t); }} style={{ padding: "7px 18px", borderRadius: "7px", border: "none", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#fff" : "var(--text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {t === "drafts" ? `초안 ${drafts.length > 0 && tab === "drafts" ? `(${drafts.length})` : ""}` : "발행됨"}
            </button>
          ))}
        </div>

        {/* 글쓰기 폼 */}
        {showWrite && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "18px" }}>새 글 작성</p>
            {/* AI 초안 생성 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <input
                placeholder="주제 입력 (예: 사내 AX 구축기, ChatGPT 업무 활용법...)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateDraft()}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={generateDraft} disabled={generating || !topic.trim()} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "#5B4FE8", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", opacity: generating ? 0.6 : 1 }}>
                {generating ? "생성 중..." : "✨ AI 초안"}
              </button>
            </div>
            <div style={{ borderBottom: "1px solid var(--border)", margin: "4px 0 8px" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="제목 *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              <textarea placeholder="요약 (한 줄 설명)" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              <textarea placeholder="본문 (마크다운 가능)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "13px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="태그 (쉼표로 구분)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input placeholder="출처명" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} style={inputStyle} />
                <input placeholder="출처 URL (선택)" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => setShowWrite(false)} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-faint)", fontSize: "13px", cursor: "pointer" }}>취소</button>
                <button onClick={saveArticle} disabled={saving || !form.title.trim()} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "저장 중..." : "초안 저장"}
                </button>
              </div>
            </div>
          </div>
        )}

        {drafts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-faint)", fontSize: "14px" }}>
            대기 중인 초안이 없어요
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {drafts.map((d) => (
              <div key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", cursor: "pointer" }} onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "var(--accent-dim)", color: "var(--accent-hover)" }}>{d.category}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{d.sourceName}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{d.date}</span>
                      </div>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", lineHeight: 1.45 }}>{d.title}</p>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>{expanded === d.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expanded === d.id && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px" }}>
                    <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text-muted)", marginBottom: "16px" }}>{d.summary}</p>
                    {d.content && (
                      <pre style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--text-faint)", whiteSpace: "pre-wrap", fontFamily: "inherit", marginBottom: "16px" }}>{d.content}</pre>
                    )}
                    {d.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
                        {d.tags.map((t) => <span key={t} style={{ fontSize: "12px", color: "var(--text-faint)", background: "var(--bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: "20px" }}>#{t}</span>)}
                      </div>
                    )}
                    {d.sourceUrl && (
                      <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--accent-hover)", textDecoration: "none" }}>{d.sourceUrl}</a>
                    )}
                  </div>
                )}

                <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => remove(d.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-faint)", fontSize: "13px", cursor: "pointer" }}>
                    삭제
                  </button>
                  {tab === "published" ? (
                    <button onClick={() => toggleHidden(d.id, !(d as Draft & { hidden?: boolean }).hidden)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "#555", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                      숨기기
                    </button>
                  ) : (
                    <button onClick={() => approve(d.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                      발행 ✓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
