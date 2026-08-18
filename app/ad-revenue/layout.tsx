import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "광고 수익 시뮬레이터 — 배너·네이티브·전면광고 수익 계산기 | toolr",
  description: "PC·모바일·앱 광고 지면별 예상 수익을 계산해보세요. CTR·CPC·PV를 입력하면 월 광고 수익을 자동으로 시뮬레이션합니다.",
  keywords: ["광고 수익 계산기", "배너광고 수익", "CTR 계산", "CPC 계산", "광고 수익 시뮬레이터", "블로그 광고 수익", "앱 광고 수익", "모바일 광고 수익"],
  openGraph: {
    title: "광고 수익 시뮬레이터 — 배너·네이티브·전면광고 수익 계산기",
    description: "PC·모바일·앱 광고 지면별 예상 수익을 계산해보세요. CTR·CPC·PV를 입력하면 월 광고 수익을 자동으로 시뮬레이션합니다.",
    url: "https://toolr.kr/ad-revenue",
    siteName: "toolr",
    locale: "ko_KR",
    type: "website",
  },
  alternates: {
    canonical: "https://toolr.kr/ad-revenue",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
