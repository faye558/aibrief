import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ai brief — AI·테크 큐레이션",
  description: "AI, 테크, 디자인, 플랫폼 분야의 핵심 아티클을 매일 큐레이션합니다",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
