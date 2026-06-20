# AI Brief — 실행 방법

## 1. Node.js 설치 (없는 경우)
https://nodejs.org 에서 LTS 버전 다운로드 후 설치

## 2. 의존성 설치
```bash
cd ~/Desktop/aibrief
npm install
```

## 3. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 에서 확인

## 4. 프로덕션 빌드
```bash
npm run build
npm start
```

---

## 기사 추가 방법
`data/articles.json` 파일에 아래 형식으로 추가:

```json
{
  "id": "7",
  "slug": "unique-slug",
  "title": "기사 제목",
  "summary": "한두 문장 요약",
  "content": "본문 (마크다운 일부 지원: **굵게**, ## 소제목, - 목록)",
  "company": "Anthropic",
  "category": "AI모델",
  "date": "2026-06-20",
  "tags": ["태그1", "태그2"],
  "imageUrl": null
}
```

## 구글 애드센스 연결
`components/AdBanner.tsx`의 광고 자리를 실제 AdSense 코드로 교체하세요.
