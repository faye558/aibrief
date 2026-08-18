"use client";
import { useState, useEffect } from "react";

export default function SimpleNav() {
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
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: "8px",
          fontSize: "16px",
          lineHeight: 1,
          color: "var(--text-muted)",
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
