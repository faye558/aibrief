import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SITE_URL = "https://aibrief.toolr.kr";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // Vercel 환경변수 NEXT_PUBLIC_GA_ID에 GA 측정 ID 입력

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AI Brief — AI·IT 뉴스 브리핑", template: "%s | AI Brief" },
  description: "Adobe, Canva, 미리캔버스, 망고보드 등 디자인툴과 Anthropic, OpenAI, Google 등 AI 주요 기업의 최신 소식을 빠르고 간결하게 전달합니다.",
  keywords: ["AI 뉴스", "IT 뉴스", "디자인툴", "Adobe", "Canva", "미리캔버스", "망고보드", "산돌", "Anthropic", "OpenAI", "인공지능"],
  authors: [{ name: "AI Brief" }],
  openGraph: {
    title: "AI Brief — AI·IT 뉴스 브리핑",
    description: "디자인툴·AI 주요 기업의 최신 소식을 빠르고 간결하게",
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "AI Brief",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "AI Brief" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Brief — AI·IT 뉴스 브리핑",
    description: "디자인툴·AI 주요 기업의 최신 소식",
    images: ["/og-default.png"],
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* WebSite 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AI Brief",
              url: SITE_URL,
              description: "Adobe, Canva, 미리캔버스, 망고보드 등 디자인툴과 Anthropic, OpenAI, Google 등 AI 기업의 최신 소식",
              inLanguage: "ko-KR",
              publisher: { "@type": "Organization", name: "AI Brief", url: SITE_URL },
            }),
          }}
        />
        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
