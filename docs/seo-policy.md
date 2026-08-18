# SEO 정책 문서

## 기본 원칙

- **title**: 검색 의도 키워드를 앞에, 부연 설명을 뒤에 (`키워드 — 부제 | toolr`)
- **description**: 160자 이내, 사용자 행동 유도 문구 포함
- **canonical**: 항상 `https://toolr.kr/{path}` 절대 경로
- **OG title**: title에서 ` | toolr` 제거한 버전
- **geo**: 한국 타겟 서비스이므로 `geo.region: KR` 전체 적용 (root layout)
- **robots**: 모든 공개 페이지 `index: true, follow: true` 명시
- **twitter card**: 모든 페이지 `summary` 타입 적용

---

## 전체 적용 현황

| 페이지 | title | description | OG | canonical | twitter | robots | geo |
|---|---|---|---|---|---|---|---|
| `toolr.kr/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (상속) |
| `toolr.kr/aibrief` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (상속) | ✅ (상속) |
| `toolr.kr/aibrief/article/[slug]` | ✅ (동적) | ✅ (동적) | ✅ | ✅ | ✅ | ✅ | ✅ (상속) |
| `toolr.kr/aibrief/timeline` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (상속) |
| `toolr.kr/ad-revenue` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (상속) |
| `toolr.kr/privacy` | ✅ | ✅ | — | ✅ | — (상속) | — (상속) | ✅ (상속) |

> geo, robots, twitter 기본값은 `app/layout.tsx`에서 전체 상속

---

## 페이지별 메타태그 상세

### `toolr.kr/` (홈)
```
title: "toolr — 작고 실용적인 AI·테크 웹 툴"
description: "toolr는 AI·테크 분야의 작고 실용적인 웹 툴을 만듭니다. ai brief, 광고 수익 계산기 등을 무료로 사용해보세요."
keywords: toolr, ai brief, 광고 수익 계산기, AI 뉴스, 웹 툴
canonical: https://toolr.kr
```

### `toolr.kr/aibrief`
```
title: "ai brief — AI·디자인·PM 업계 뉴스 큐레이션"
description: "AI 디자인 툴, UX/프로덕트 디자인, PM·BD의 일하는 방식 변화 등 핵심 아티클을 매일 자동 수집·요약합니다."
keywords: AI 뉴스, AI 디자인, UX 뉴스, PM 뉴스, 프로덕트 매니저, AI 큐레이션, 테크 뉴스
canonical: https://toolr.kr/aibrief
```

### `toolr.kr/aibrief/article/[slug]` (동적)
```
title: "{article.title} — ai brief"
description: article.summary 앞 160자
OG type: article
canonical: https://toolr.kr/aibrief/article/{slug}
```

### `toolr.kr/aibrief/timeline`
```
title: "타임라인 — ai brief"
description: "AI·디자인·PM 분야 뉴스를 날짜 순으로 확인하세요."
canonical: https://toolr.kr/aibrief/timeline
```

### `toolr.kr/ad-revenue`
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
| 브랜드 | ` \| toolr` (서브 서비스엔 생략 가능) | |
| 최대 길이 | 60자 이내 (Google 기준) | |

---

## sitemap 관리

파일: `app/sitemap.ts`

새 페이지 추가 시 아래 항목을 함께 업데이트:
- `changeFrequency`: 콘텐츠 업데이트 주기 (`daily` / `monthly`)
- `priority`: 1.0(홈) → 0.9(주요) → 0.8(서브) → 0.7(아티클)

---

## Search Console

- `toolr.kr` → 별도 속성 등록 필요 (ad-revenue 등 toolr.kr 경로 색인용)
- 새 페이지 배포 후: Search Console → URL 검사 → 색인 생성 요청

---

## 새 페이지 추가 체크리스트

1. `app/{path}/layout.tsx` 또는 `page.tsx`에 `export const metadata` 추가
2. title / description / keywords / OG / canonical / twitter / robots 작성
3. `app/sitemap.ts`에 URL 추가
4. `docs/seo-policy.md` 페이지별 현황 테이블 업데이트
5. 배포 후 Search Console에서 색인 요청
