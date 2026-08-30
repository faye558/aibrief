import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-L23J59T9PB";

export const metadata: Metadata = {
  title: "ai brief — AI·테크 큐레이션",
  description: "AI, 테크, 디자인, 플랫폼 분야의 핵심 아티클을 매일 큐레이션합니다",
  metadataBase: new URL("https://toolr.kr"),
  robots: { index: true, follow: true },
  twitter: {
    card: "summary",
    title: "ai brief — AI·테크 큐레이션",
    description: "AI, 테크, 디자인, 플랫폼 분야의 핵심 아티클을 매일 큐레이션합니다",
  },
  other: {
    "geo.region": "KR",
    "geo.placename": "Korea",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6383180248696987" crossOrigin="anonymous" strategy="afterInteractive" />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        ` }} />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('theme');
            if (t) document.documentElement.setAttribute('data-theme', t);
          })();
        `}} />
        {children}
      </body>
    </html>
  );
}
