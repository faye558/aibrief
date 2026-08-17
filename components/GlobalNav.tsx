"use client";
import { useState, useEffect } from "react";

export default function GlobalNav() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <>
      <header
        style={{
          height: "56px",
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 0,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <a href="/aibrief" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            ai
          </div>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>
            brief
          </span>
        </a>

        <div style={{ flex: 1 }} />

        <a href="https://travel.toolr.kr/" style={{ fontSize: "13px", color: "var(--text-faint)", padding: "5px 10px", borderRadius: "6px", textDecoration: "none" }}>
          toolr
        </a>

        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "6px 8px", borderRadius: "8px", fontSize: "16px",
            lineHeight: 1, color: "var(--text-muted)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* 햄버거 버튼 */}
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "5px", marginLeft: "4px" }}
          aria-label="메뉴"
        >
          <span style={{ display: "block", width: "18px", height: "2px", background: "currentColor", borderRadius: "2px", transition: "opacity 0.15s", opacity: open ? 0 : 1 }} />
          <span style={{ display: "block", width: "18px", height: "2px", background: "currentColor", borderRadius: "2px" }} />
          <span style={{ display: "block", width: "18px", height: "2px", background: "currentColor", borderRadius: "2px", transition: "opacity 0.15s", opacity: open ? 0 : 1 }} />
        </button>
      </header>

      {/* 드롭다운 메뉴 */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{ position: "fixed", top: "56px", right: "16px", zIndex: 99, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px", minWidth: "180px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            <a href="https://travel.toolr.kr/" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "var(--text)", textDecoration: "none" }}>
              ✈️ travel
            </a>
            <a href="https://toolr.kr" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "var(--text)", textDecoration: "none" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg,#7B97FF,#a78bfa)", marginRight: "8px", verticalAlign: "middle" }} />
              toolr
            </a>
            <div style={{ height: "1px", background: "var(--border)", margin: "6px 0" }} />
            <a href="mailto:fanfaye1@gmail.com" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
              문의
            </a>
            <a href="/privacy" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}>
              개인정보처리방침
            </a>
          </div>
        </>
      )}
    </>
  );
}
