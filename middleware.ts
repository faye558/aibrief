import { NextRequest, NextResponse } from "next/server";

// 비ASCII 문자가 통째로 지워져 깨졌던 슬러그 → 로마자로 재생성된 슬러그로
// 301 리다이렉트. SEO 감사에서 발견, 실제 공개(라이브)됐던 11건만 대상
// (2026-08-30).
const SLUG_REDIRECTS: Record<string, string> = {
  "-tossion-release": "toseu-jache-gaebal-qa-peulraespom-tosyeontossion-gonggae-heu",
  "-webview-lynx": "danggeun-webview-hangye-geugbog-wihae-lynx-gisul-doib-gyeolj",
  "-lynx-intro": "danggeun-webbyu-seongneung-hangye-geugbog-wihae-keuroseupeul",
  "-vllm-ai-native": "neibeo-vllm-model-byeonhwanbaeporeul-ai-nativero-jadonghwaha",
  "-vllm-model": "neibeo-vllm-peulreogeuineuro-geomsaeg-ai-model-seobing-seong",
  "-sage-release": "rain-boan-eobmuyong-ai-eijeonteu-peulraespom-sage-gaebalgi-g",
  "-sms-intro": "danggeun-injeung-siseutemui-byeoncheonsa-sms-jeomyu-injeungb",
  "-match-console-mai": "musinsa-gaeinhwa-unyeong-dogu-match-consolegwa-ai-eosiseuteo",
  "-news": "musinsa-ai-giban-gaebal-jeon-gwajeong-hyeogsin-dameun-paeteo",
  "-news-2": "musinsa-ai-neitibeu-jojigeul-wihan-2cheung-simaentig-reieoro",
  "-summit": "kakao-busaneseo-ai-doc-summit-26-gaechoejiyeog-ai-saengtaegy",
};

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  const articleMatch = pathname.match(/^\/aibrief\/article\/([^/]+)\/?$/);
  if (articleMatch) {
    const oldSlug = decodeURIComponent(articleMatch[1]);
    const newSlug = SLUG_REDIRECTS[oldSlug];
    if (newSlug) {
      return NextResponse.redirect(`https://toolr.kr/aibrief/article/${newSlug}`, 301);
    }
  }

  if (host === "aibrief.toolr.kr" || host === "www.aibrief.toolr.kr") {
    if (pathname === "/privacy") {
      return NextResponse.redirect("https://toolr.kr/privacy", 301);
    }
    return NextResponse.redirect(
      `https://toolr.kr/aibrief${pathname}${req.nextUrl.search}`,
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
