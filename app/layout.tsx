import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "AI Brief — AI·IT 뉴스 브리핑",
  description: "Anthropic, OpenAI, Google, Canva, Adobe 등 AI·IT 주요 기업의 최신 소식을 빠르고 간결하게 전달합니다.",
  keywords: ["AI 뉴스", "IT 뉴스", "Anthropic", "OpenAI", "Google", "Canva", "Adobe", "인공지능"],
  openGraph: {
    title: "AI Brief — AI·IT 뉴스 브리핑",
    description: "AI·IT 주요 기업의 최신 소식을 빠르고 간결하게",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
