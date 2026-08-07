"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function DraftsPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchDrafts = useCallback(async (k: string) => {
    setLoading(true);
    const res = await fetch(`/api/drafts?key=${encodeURIComponent(k)}`);
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

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", width: "320px" }}>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>초안 검수</p>
          <input
            type="password"
            placeholder="접근 키 입력"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchDrafts(key)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text)" }}>초안 검수</h1>
            <p style={{ fontSize: "13px", color: "var(--text-faint)", marginTop: "4px" }}>{drafts.length}개 대기 중</p>
          </div>
          {msg && <span style={{ fontSize: "13px", color: "var(--accent-hover)", fontWeight: 600 }}>{msg}</span>}
        </div>

        {drafts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-faint)", fontSize: "14px" }}>
            대기 중인 초안이 없어요
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {drafts.map((d) => (
              <div key={d.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
                {/* 헤더 */}
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

                {/* 펼침 */}
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

                {/* 액션 버튼 */}
                <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => remove(d.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-faint)", fontSize: "13px", cursor: "pointer" }}>
                    삭제
                  </button>
                  <button onClick={() => approve(d.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    발행 ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
