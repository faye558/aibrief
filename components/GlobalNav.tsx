"use client";

export default function GlobalNav() {
  return (
    <header
      style={{
        height: "56px",
        background: "#111318",
        borderBottom: "1px solid #2A2B30",
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
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "9px",
            background: "#7C6FF7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          ai
        </div>
        <span
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#E6E6F2",
            letterSpacing: "-0.5px",
          }}
        >
          brief
        </span>
      </a>

      <div style={{ flex: 1 }} />

      <a
        href="https://travel.toolr.kr/"
        style={{
          fontSize: "13px",
          color: "#3A3A52",
          padding: "5px 10px",
          borderRadius: "6px",
          textDecoration: "none",
        }}
      >
        toolr
      </a>
    </header>
  );
}
