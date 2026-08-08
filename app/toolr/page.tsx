import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "toolr — AI·테크 서비스",
  description: "toolr는 AI·테크 분야의 유용한 서비스를 만듭니다.",
};

export default function ToolrPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", color: "#e6edf3", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "12px" }}>
          toolr
        </div>
        <p style={{ fontSize: "15px", color: "#8b949e", lineHeight: 1.6, marginBottom: "48px" }}>
          AI·테크 분야의 유용한 서비스를 만듭니다.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a href="https://aibrief.toolr.kr" style={{ display: "block", padding: "20px 24px", borderRadius: "12px", background: "#161b22", border: "1px solid #30363d", textDecoration: "none", textAlign: "left", transition: "border-color 0.15s" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#e6edf3", marginBottom: "4px" }}>ai brief</div>
            <div style={{ fontSize: "13px", color: "#8b949e" }}>AI·테크·디자인 업계 소식 큐레이션</div>
          </a>
        </div>

        <div style={{ marginTop: "48px", fontSize: "12px", color: "#484f58" }}>
          © 2026 toolr.kr
        </div>
      </div>
    </div>
  );
}
