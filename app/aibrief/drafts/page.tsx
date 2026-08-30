"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  const [writeMode, setWriteMode] = useState<"article" | "outlink">("article");
  const [outlinkForm, setOutlinkForm] = useState({ title: "", teaser: "", sourceUrl: "", sourceName: "", category: "IT·테크", tags: "" });
  const [outlinkSaving, setOutlinkSaving] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", content: "", category: "IT·테크", tags: "", sourceName: "", sourceUrl: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", summary: "", content: "", category: "IT·테크", tags: "", sourceName: "", sourceUrl: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});
  const translatingRef = useRef(false);

  const fetchDrafts = useCallback(async (k: string, t: "drafts" | "published" = "drafts") => {
    setLoading(true);
    const res = await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(k)}&tab=${t}`);
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
    await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDrafts((d) => d.filter((a) => a.id !== id));
    setMsg("✓ 발행됨");
    setTimeout(() => setMsg(""), 2000);
  }

  async function toggleHidden(id: string, hide: boolean) {
    await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: hide ? "hide" : "unhide" }),
    });
    setDrafts((d) => d.filter((a) => a.id !== id));
    setMsg(hide ? "숨김 처리됨" : "복원됨");
    setTimeout(() => setMsg(""), 2000);
  }

  function startEdit(d: Draft) {
    setEditingId(d.id);
    setEditForm({
      title: d.title,
      summary: d.summary,
      content: d.content ?? "",
      category: d.category,
      tags: d.tags.join(", "),
      sourceName: d.sourceName,
      sourceUrl: d.sourceUrl ?? "",
    });
    setExpanded(d.id);
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action: "edit",
        ...editForm,
        tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        sourceUrl: editForm.sourceUrl || null,
      }),
    });
    setDrafts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, ...editForm, tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean), sourceUrl: editForm.sourceUrl || null }
          : a
      )
    );
    setEditingId(null);
    setMsg("✓ 수정됨");
    setTimeout(() => setMsg(""), 2000);
    setEditSaving(false);
  }

  async function remove(id: string) {
    await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
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
    const res = await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", topic }),
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

  function isEnglish(t: string) {
    const en = (t.match(/[A-Za-z\s]/g) || []).length;
    return t.length > 0 && en / t.length > 0.5;
  }

  useEffect(() => {
    if (!drafts.length || translatingRef.current) return;
    const needTranslation = drafts.filter((d) => isEnglish(d.title) && !translatedTitles[d.id]);
    if (!needTranslation.length) return;
    translatingRef.current = true;
    (async () => {
      for (const d of needTranslation) {
        try {
          const res = await fetch("/aibrief/api/translate", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: d.title }),
          });
          if (res.ok) {
            const { translated } = await res.json();
            setTranslatedTitles((prev) => ({ ...prev, [d.id]: translated }));
          }
        } catch { /* skip */ }
      }
      translatingRef.current = false;
    })();
  }, [drafts]);

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const visible = drafts.filter((d) => !search.trim() || d.title.toLowerCase().includes(search.toLowerCase()));
    if (checked.size === visible.length) setChecked(new Set());
    else setChecked(new Set(visible.map((d) => d.id)));
  }

  async function bulkHide() {
    if (!checked.size) return;
    setBulkLoading(true);
    for (const id of checked) {
      await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "hide" }),
      });
    }
    setDrafts((d) => d.filter((a) => !checked.has(a.id)));
    setMsg(`${checked.size}개 숨김`);
    setChecked(new Set());
    setBulkLoading(false);
    setTimeout(() => setMsg(""), 2000);
  }

  async function bulkDelete() {
    if (!checked.size) return;
    setBulkLoading(true);
    for (const id of checked) {
      await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
    setDrafts((d) => d.filter((a) => !checked.has(a.id)));
    setMsg(`${checked.size}개 삭제`);
    setChecked(new Set());
    setBulkLoading(false);
    setTimeout(() => setMsg(""), 2000);
  }

  async function saveOutlink() {
    if (!outlinkForm.title.trim() || !outlinkForm.sourceUrl.trim()) return;
    setOutlinkSaving(true);
    const res = await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: outlinkForm.title,
        summary: outlinkForm.teaser,
        content: "",
        category: outlinkForm.category,
        tags: outlinkForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        sourceName: outlinkForm.sourceName,
        sourceUrl: outlinkForm.sourceUrl,
        type: "outlink",
      }),
    });
    if (res.ok) {
      setMsg("✓ 아웃링크 저장됨");
      setOutlinkForm({ title: "", teaser: "", sourceUrl: "", sourceName: "", category: "IT·테크", tags: "" });
      setShowWrite(false);
      fetchDrafts(key);
    } else {
      setMsg("저장 실패");
    }
    setOutlinkSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function saveArticle() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch(`/aibrief/api/drafts?key=${encodeURIComponent(key)}`, {
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
            <button onClick={() => { setShowWrite(!showWrite); setWriteMode("outlink"); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {showWrite && writeMode === "outlink" ? "닫기" : "+ 아웃링크"}
            </button>
            <button onClick={() => { setShowWrite(!showWrite); setWriteMode("article"); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {showWrite && writeMode === "article" ? "닫기" : "+ 새 글"}
            </button>
          </div>
        </div>

        {/* 검색 */}
        <input
          placeholder="제목으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, marginBottom: "16px" }}
        />

        {/* 탭 */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "var(--surface)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
          {(["drafts", "published"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); fetchDrafts(key, t); }} style={{ padding: "7px 18px", borderRadius: "7px", border: "none", background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#fff" : "var(--text-faint)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              {t === "drafts" ? `초안 ${drafts.length > 0 && tab === "drafts" ? `(${drafts.length})` : ""}` : "발행됨"}
            </button>
          ))}
        </div>

        {/* 아웃링크 폼 */}
        {showWrite && writeMode === "outlink" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>아웃링크 추가</p>
            <p style={{ fontSize: "12px", color: "var(--text-faint)", marginBottom: "18px" }}>브런치·블로그 등 외부 글 — 제목+티저만 노출, 원문으로 연결</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="원문 URL *" value={outlinkForm.sourceUrl} onChange={(e) => setOutlinkForm({ ...outlinkForm, sourceUrl: e.target.value })} style={inputStyle} />
              <input placeholder="제목 *" value={outlinkForm.title} onChange={(e) => setOutlinkForm({ ...outlinkForm, title: e.target.value })} style={inputStyle} />
              <textarea placeholder="티저 (1-2줄 소개)" value={outlinkForm.teaser} onChange={(e) => setOutlinkForm({ ...outlinkForm, teaser: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input placeholder="출처명 (예: 브런치, Medium)" value={outlinkForm.sourceName} onChange={(e) => setOutlinkForm({ ...outlinkForm, sourceName: e.target.value })} style={inputStyle} />
                <select value={outlinkForm.category} onChange={(e) => setOutlinkForm({ ...outlinkForm, category: e.target.value })} style={inputStyle}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input placeholder="태그 (쉼표로 구분)" value={outlinkForm.tags} onChange={(e) => setOutlinkForm({ ...outlinkForm, tags: e.target.value })} style={inputStyle} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => setShowWrite(false)} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-faint)", fontSize: "13px", cursor: "pointer" }}>취소</button>
                <button onClick={saveOutlink} disabled={outlinkSaving || !outlinkForm.title.trim() || !outlinkForm.sourceUrl.trim()} style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: outlinkSaving ? 0.6 : 1 }}>
                  {outlinkSaving ? "저장 중..." : "초안 저장"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 글쓰기 폼 */}
        {showWrite && writeMode === "article" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "24px", marginBottom: "24px" }}>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "18px" }}>새 글 작성 (AI 요약)</p>
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
          <>
            {/* 일괄 액션 바 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-faint)", cursor: "pointer" }}>
                <input type="checkbox"
                  checked={checked.size > 0 && checked.size === drafts.filter((d) => !search.trim() || d.title.toLowerCase().includes(search.toLowerCase())).length}
                  onChange={toggleAll}
                />
                전체 선택
              </label>
              {checked.size > 0 && (
                <>
                  <span style={{ fontSize: "13px", color: "var(--accent-hover)", fontWeight: 600 }}>{checked.size}개 선택</span>
                  <button onClick={bulkHide} disabled={bulkLoading} style={{ padding: "5px 14px", borderRadius: "7px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "13px", cursor: "pointer" }}>
                    일괄 숨기기
                  </button>
                  <button onClick={bulkDelete} disabled={bulkLoading} style={{ padding: "5px 14px", borderRadius: "7px", border: "none", background: "#e53e3e", color: "#fff", fontSize: "13px", cursor: "pointer" }}>
                    일괄 삭제
                  </button>
                </>
              )}
            </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {drafts.filter((d) => !search.trim() || d.title.toLowerCase().includes(search.toLowerCase())).map((d) => (
              <div key={d.id} style={{ background: "var(--surface)", border: checked.has(d.id) ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", cursor: "pointer" }} onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", justifyContent: "space-between" }}>
                    <input type="checkbox" checked={checked.has(d.id)} onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleCheck(d.id)}
                      style={{ marginTop: "3px", flexShrink: 0, width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "var(--accent-dim)", color: "var(--accent-hover)" }}>{d.category}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{d.sourceName}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-faint)" }}>{d.date}</span>
                      </div>
                      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", lineHeight: 1.45 }}>
                        {translatedTitles[d.id] || d.title}
                        {translatedTitles[d.id] && isEnglish(d.title) && (
                          <span style={{ fontSize: "11px", color: "var(--text-faint)", marginLeft: "8px", fontWeight: 400 }}>번역됨</span>
                        )}
                      </p>
                    </div>
                    <span style={{ color: "var(--text-faint)", fontSize: "12px", flexShrink: 0, marginTop: "2px" }}>{expanded === d.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {expanded === d.id && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "20px 24px" }}>
                    {editingId === d.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="제목" style={inputStyle} />
                        <textarea value={editForm.summary} onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })} placeholder="요약" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                        <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} placeholder="본문" rows={8} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "13px" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="태그 (쉼표로 구분)" style={inputStyle} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <input value={editForm.sourceName} onChange={(e) => setEditForm({ ...editForm, sourceName: e.target.value })} placeholder="출처명" style={inputStyle} />
                          <input value={editForm.sourceUrl} onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })} placeholder="출처 URL" style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                          <button onClick={() => setEditingId(null)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-faint)", fontSize: "13px", cursor: "pointer" }}>취소</button>
                          <button onClick={() => saveEdit(d.id)} disabled={editSaving} style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: editSaving ? 0.6 : 1 }}>{editSaving ? "저장 중..." : "저장"}</button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => remove(d.id)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-faint)", fontSize: "13px", cursor: "pointer" }}>
                    삭제
                  </button>
                  {editingId !== d.id && (
                    <button onClick={() => startEdit(d)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "13px", cursor: "pointer" }}>
                      수정
                    </button>
                  )}
                  {tab === "published" ? (
                    <button onClick={() => toggleHidden(d.id, !(d as Draft & { hidden?: boolean }).hidden)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: (d as Draft & { hidden?: boolean }).hidden ? "var(--accent)" : "#555", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                      {(d as Draft & { hidden?: boolean }).hidden ? "노출" : "숨기기"}
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
          </>
        )}
      </div>
    </div>
  );
}
