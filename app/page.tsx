import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "toolr — 작고 실용적인 AI·테크 웹 툴",
  description: "toolr는 AI·테크 분야의 작고 실용적인 웹 툴을 만듭니다. ai brief, 광고 수익 계산기 등을 무료로 사용해보세요.",
  keywords: ["toolr", "ai brief", "광고 수익 계산기", "AI 뉴스", "웹 툴"],
  openGraph: {
    title: "toolr — 작고 실용적인 AI·테크 웹 툴",
    description: "toolr는 AI·테크 분야의 작고 실용적인 웹 툴을 만듭니다.",
    url: "https://toolr.kr",
    siteName: "toolr",
    locale: "ko_KR",
    type: "website",
  },
  alternates: { canonical: "https://toolr.kr" },
  robots: { index: true, follow: true },
  twitter: {
    card: "summary",
    title: "toolr — 작고 실용적인 AI·테크 웹 툴",
    description: "toolr는 AI·테크 분야의 작고 실용적인 웹 툴을 만듭니다.",
  },
};

export default function ToolrPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", color: "#e6edf3", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "4px" }}>
          <span style={{ background: "linear-gradient(135deg, #7B97FF 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>.</span>toolr
        </div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px", letterSpacing: "0.1em" }}>
          툴러
        </div>
        <h1 style={{ fontSize: "15px", fontWeight: 600, color: "#8b949e", marginBottom: "8px" }}>
          매일 업데이트되는 AI 소식과 툴 모음
        </h1>
        <p style={{ fontSize: "15px", color: "#8b949e", lineHeight: 1.8, marginBottom: "48px" }}>
          쓸모 있는 것들을 만듭니다.<br />
          작고 실용적인 웹 툴을 하나씩 쌓아가는 작은 스튜디오예요.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a href="/aibrief" style={{ display: "block", padding: "20px 24px", borderRadius: "12px", background: "#161b22", border: "1px solid #30363d", textDecoration: "none", textAlign: "left", transition: "border-color 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #7B97FF, #a78bfa)", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#e6edf3" }}>ai brief</span>
            </div>
            <div style={{ fontSize: "13px", color: "#8b949e", paddingLeft: "16px" }}>AI·테크·디자인 업계 소식 큐레이션</div>
          </a>

          <a href="/ad-revenue" style={{ display: "block", padding: "20px 24px", borderRadius: "12px", background: "#161b22", border: "1px solid #30363d", textDecoration: "none", textAlign: "left", transition: "border-color 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "linear-gradient(135deg, #6055E8, #7C6FF7)", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#e6edf3" }}>ad-revenue</span>
            </div>
            <div style={{ fontSize: "13px", color: "#8b949e", paddingLeft: "16px" }}>광고 배너 매출 시뮬레이터</div>
          </a>
        </div>

        <div style={{ marginTop: "48px", fontSize: "12px", color: "#484f58", display: "flex", gap: "16px", justifyContent: "center" }}>
          <span>© 2026 toolr.kr</span>
          <a href="mailto:fanfaye1@gmail.com" style={{ color: "#484f58", textDecoration: "none" }}>문의</a>
          <a href="/privacy" style={{ color: "#484f58", textDecoration: "none" }}>개인정보처리방침</a>
        </div>
      </div>
    </div>
  );
}
