import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-L23J59T9PB";

export const metadata: Metadata = {
  title: "ai brief — AI·테크 큐레이션",
  description: "AI, 테크, 디자인, 플랫폼 분야의 핵심 아티클을 매일 큐레이션합니다",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
