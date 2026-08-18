# SEO 정책 문서

## 기본 원칙

- **title**: 검색 의도 키워드를 앞에, 부연 설명을 뒤에 (`키워드 — 부제 | toolr`)
- **description**: 160자 이내, 사용자 행동 유도 문구 포함
- **canonical**: 항상 `https://toolr.kr/{path}` 절대 경로
- **OG title**: title에서 ` | toolr` 제거한 버전

---

## 페이지별 메타태그

### `/aibrief` (메인)
```
title: "aibrief — AI 뉴스 큐레이션"
description: "AI 디자인, UX, PM/BD, 생산성 분야의 최신 뉴스를 매일 자동 수집·요약합니다."
canonical: https://toolr.kr/aibrief
```

### `/ad-revenue` (광고 수익 계산기)
```
title: "광고 수익 계산기 — 예상 광고 매출 시뮬레이터 | toolr"
description: "PC·모바일·앱 광고 지면별 예상 수익을 계산해보세요. CTR·CPC·PV를 입력하면 월 광고 수익을 자동으로 시뮬레이션합니다."
keywords: 광고 수익 계산기, 배너광고 수익, CTR 계산, CPC 계산, 광고 수익 시뮬레이터, 블로그 광고 수익, 앱 광고 수익, 모바일 광고 수익
canonical: https://toolr.kr/ad-revenue
```

---

## title 작성 규칙

| 구성 요소 | 설명 | 예시 |
|---|---|---|
| 핵심 키워드 | 사용자가 검색하는 단어 | `광고 수익 계산기` |
| 구분자 | ` — ` (em dash + 공백) | |
| 부제 | 키워드를 보조하는 설명 | `예상 광고 매출 시뮬레이터` |
| 브랜드 | ` \| toolr` | |
| 최대 길이 | 60자 이내 (Google 기준) | |

## sitemap 관리

파일: `app/sitemap.ts`

새 페이지 추가 시 아래 항목을 함께 업데이트:
- `changeFrequency`: 콘텐츠 업데이트 주기 (`daily` / `monthly`)
- `priority`: 1.0(홈) → 0.9(주요) → 0.8(서브) → 0.7(아티클)

## Search Console

- `aibrief.toolr.kr` → 기존 등록됨
- `toolr.kr` → 별도 속성으로 등록 필요 (ad-revenue 등 toolr.kr 경로 색인용)

새 페이지 배포 후: Search Console → URL 검사 → 색인 생성 요청
