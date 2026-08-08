"use client";
import { useState } from "react";

export default function GlobalNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        style={{
          height: "56px",
          background: "#16171A",
          borderBottom: "1px solid #2C2D33",
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
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#7C6FF7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            ai
          </div>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#E6E6F2", letterSpacing: "-0.5px" }}>
            brief
          </span>
        </a>

        <div style={{ flex: 1 }} />

        <a href="https://travel.toolr.kr/" style={{ fontSize: "13px", color: "#3A3A52", padding: "5px 10px", borderRadius: "6px", textDecoration: "none" }}>
          toolr
        </a>

        {/* 햄버거 버튼 */}
        <button
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", color: "#8b949e", display: "flex", flexDirection: "column", gap: "5px", marginLeft: "4px" }}
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
          <div style={{ position: "fixed", top: "56px", right: "16px", zIndex: 99, background: "#1c2128", border: "1px solid #2C2D33", borderRadius: "12px", padding: "8px", minWidth: "180px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <a href="https://travel.toolr.kr/" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "#e6edf3", textDecoration: "none" }}>
              ✈️ travel
            </a>
            <a href="https://toolr.kr" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "#e6edf3", textDecoration: "none" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg,#7B97FF,#a78bfa)", marginRight: "8px", verticalAlign: "middle" }} />
              toolr
            </a>
            <div style={{ height: "1px", background: "#2C2D33", margin: "6px 0" }} />
            <a href="mailto:fanfaye1@gmail.com" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "#8b949e", textDecoration: "none" }}>
              문의
            </a>
            <a href="/privacy" style={{ display: "block", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "#8b949e", textDecoration: "none" }}>
              개인정보처리방침
            </a>
          </div>
        </>
      )}
    </>
  );
}
