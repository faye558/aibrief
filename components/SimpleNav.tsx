"use client";
import { useState, useEffect } from "react";

export default function SimpleNav() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [open, setOpen] = useState(false);

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
      <header style={{
        height: "52px",
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <a
          href="https://toolr.kr"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
            color: "var(--text-muted)",
            fontSize: "13px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          toolr.kr
        </a>

        <div style={{ flex: 1 }} />

        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: "8px", fontSize: "16px", lineHeight: 1, color: "var(--text-muted)" }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

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

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{ position: "fixed", top: "56px", right: "16px", zIndex: 99, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px", minWidth: "180px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            <a href="/aibrief" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "var(--text)", textDecoration: "none" }}>
              🤖 ai brief
            </a>
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
