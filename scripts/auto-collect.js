#!/usr/bin/env node
/**
 * AI Brief 자동 수집 스크립트
 *
 * 사용법:
 *   node scripts/auto-collect.js
 *   node scripts/auto-collect.js --dry-run   (실제 저장 없이 결과만 출력)
 *
 * type: "outlink" 피드만 처리:
 *   - includeKeywords 2개 이상 매칭 → hidden: false (바로 발행)
 *   - includeKeywords 1개 매칭 or 필터 없는 피드 → hidden: true (드래프트)
 *   - excludeKeywords 매칭 → 완전 제외
 *   - 이미 sourceUrl이 articles.json에 있으면 → 스킵
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");
const ARTICLES_PATH = path.join(__dirname, "../data/articles.json");

// ===== 아웃링크 수집 피드 =====
const OUTLINK_FEEDS = [
  {
    company: "velog",
    category: "블로그",
    name: "달리는 개발자 (giyoul)",
    url: "https://v2.velog.io/rss/@giyoul",
    sourceName: "달리는 개발자 (giyoul)",
  },
  {
    company: "velog",
    category: "블로그",
    name: "teo의 블로그",
    url: "https://v2.velog.io/rss/@teo",
    sourceName: "teo의 블로그",
  },
  {
    company: "딜라이트룸",
    category: "블로그",
    name: "딜라이트룸 Medium",
    url: "https://medium.com/feed/delightroom",
    sourceName: "딜라이트룸 Medium",
  },
  {
    company: "토스",
    category: "블로그",
    name: "토스 기술블로그",
    url: "https://toss.tech/rss.xml",
    sourceName: "토스 기술블로그",
    includeKeywords: ["직무", "조직", "일하는", "문화", "팀", "협업", "리더십", "채용", "온보딩", "성장", "커리어", "디자이너", "PM", "프로덕트", "매니저", "디자인시스템", "프로세스", "워크플로우", "AI", "합치", "통합", "운영"],
    excludeKeywords: ["API", "SDK", "아키텍처", "서버", "데이터베이스", "쿼리", "알고리즘", "컴파일", "배포", "인프라", "kubernetes", "docker", "네트워크", "캐시"],
  },
  {
    company: "당근",
    category: "블로그",
    name: "당근 테크 Medium",
    url: "https://medium.com/feed/daangn",
    sourceName: "당근 Medium",
    includeKeywords: ["직무", "조직", "일하는", "문화", "팀", "협업", "리더십", "채용", "온보딩", "성장", "커리어", "디자이너", "PM", "프로덕트", "매니저", "디자인시스템", "프로세스", "워크플로우", "AI", "합치", "통합", "운영"],
    excludeKeywords: ["API", "SDK", "아키텍처", "서버", "데이터베이스", "쿼리", "알고리즘", "컴파일", "인프라", "kubernetes", "docker", "네트워크", "캐시"],
  },
  {
    company: "카카오",
    category: "블로그",
    name: "카카오 테크블로그",
    url: "https://tech.kakao.com/feed/",
    sourceName: "카카오 테크블로그",
    includeKeywords: ["직무", "조직", "일하는", "문화", "팀", "협업", "리더십", "채용", "온보딩", "성장", "커리어", "디자이너", "PM", "프로덕트", "매니저", "디자인시스템", "워크플로우", "AI", "합치", "통합"],
    excludeKeywords: ["API", "SDK", "아키텍처", "서버", "데이터베이스", "쿼리", "알고리즘", "컴파일", "배포", "인프라", "kubernetes", "docker", "네트워크", "캐시"],
  },
  {
    company: "뱅크샐러드",
    category: "블로그",
    name: "뱅크샐러드 블로그",
    url: "https://blog.banksalad.com/rss.xml",
    sourceName: "뱅크샐러드 블로그",
    includeKeywords: ["직무", "조직", "일하는", "문화", "팀", "협업", "리더십", "채용", "온보딩", "성장", "커리어", "AI", "워크플로우", "프로세스"],
    excludeKeywords: ["API", "SDK", "아키텍처", "서버", "데이터베이스", "알고리즘", "인프라", "kubernetes", "docker"],
  },
  {
    company: "Medium",
    category: "블로그",
    name: "Medium — ai-workflow",
    url: "https://medium.com/feed/tag/ai-workflow",
    sourceName: "Medium",
  },
  {
    company: "Medium",
    category: "블로그",
    name: "Medium — claude-code",
    url: "https://medium.com/feed/tag/claude-code",
    sourceName: "Medium",
  },
];

// ===== 유틸 =====
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { headers: { "User-Agent": "AIBrief/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const next = loc.startsWith("http") ? loc : new URL(loc, url).href;
        resolve(fetchUrl(next));
        return;
      }
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseRSSItems(xml) {
  const items = [];
  const rx = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const b = m[1];
    const title = ((b.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || b.match(/<title>(.*?)<\/title>/) || [])[1] || "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    const link = ((b.match(/<link>(.*?)<\/link>/) || [])[1] || "").trim();
    const pubDate = ((b.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "").trim();
    const desc = ((b.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || b.match(/<description>(.*?)<\/description>/) || [])[1] || "")
      .replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

    const dateObj = pubDate ? new Date(pubDate) : null;
    const cutoff = new Date("2026-01-01");
    if (dateObj && dateObj < cutoff) continue;

    items.push({
      title,
      link,
      date: dateObj ? dateObj.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      summary: desc.slice(0, 150).trim(),
    });
  }
  return items.slice(0, 10);
}

function makeSlug(title, existingSlugs) {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/-+$/, "");
  let slug = base;
  let i = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// 전역 제외 주제 — 제목에 포함되면 무조건 수집 안 함
const GLOBAL_EXCLUDE = [
  // AI 벤치마크/성능비교
  "벤치마크", "benchmark", "AAII", "leaderboard", "리더보드", "성능 비교", "모델 비교", "점수", "순위",
  // 사이버보안/해킹
  "해킹", "사이버", "보안취약점", "취약점", "랜섬웨어", "악성코드", "블랙햇", "black hat", "CVE", "exploit", "phishing",
  // 정치/사회 이슈
  "선거", "음모론", "LGBT", "정치", "전쟁", "군사", "분쟁", "시위", "인권",
  // 하드웨어/액세서리
  "액세서리", "케이스", "키보드", "마우스", "하드웨어", "블랙베리", "이어폰", "헤드폰",
  // 음악 생성 AI
  "Suno", "Udio", "음악 생성", "music generation", "작곡 AI",
  // 암호화/보안 기술
  "동형 암호", "homomorphic", "암호화", "워터마킹", "watermark", "워터마크",
];

// 매칭 강도: 2개 이상 → 발행, 1개 or 필터없음 → 드래프트
function classify(title, feed) {
  const lowerTitle = title.toLowerCase();
  if (GLOBAL_EXCLUDE.some((k) => lowerTitle.includes(k.toLowerCase()))) {
    return "skip";
  }
  if (feed.excludeKeywords?.some((k) => lowerTitle.includes(k.toLowerCase()))) {
    return "skip";
  }
  if (!feed.includeKeywords) {
    return "draft"; // 필터 없는 피드는 항상 드래프트
  }
  const matchCount = feed.includeKeywords.filter((k) => title.includes(k)).length;
  if (matchCount >= 2) return "publish";
  if (matchCount === 1) return "draft";
  return "skip";
}

async function main() {
  const articles = JSON.parse(fs.readFileSync(ARTICLES_PATH, "utf-8"));
  const existingUrls = new Set(articles.map((a) => a.sourceUrl).filter(Boolean));
  const existingSlugs = new Set(articles.map((a) => a.slug).filter(Boolean));
  const maxId = Math.max(...articles.map((a) => parseInt(a.id) || 0));

  const toPublish = [];
  const toDraft = [];
  let nextId = maxId + 1;

  console.log("=".repeat(60));
  console.log("AI Brief 자동 수집");
  console.log("실행 날짜:", new Date().toISOString().slice(0, 10));
  if (DRY_RUN) console.log("*** DRY RUN — 저장 안 함 ***");
  console.log("=".repeat(60));

  for (const feed of OUTLINK_FEEDS) {
    process.stdout.write(`▶ ${feed.name}... `);
    try {
      const xml = await fetchUrl(feed.url);
      const items = parseRSSItems(xml);
      let added = 0;

      for (const item of items) {
        if (!item.link || existingUrls.has(item.link)) continue;

        const action = classify(item.title, feed);
        if (action === "skip") continue;

        const slug = makeSlug(item.title, existingSlugs);
        existingSlugs.add(slug);
        existingUrls.add(item.link);

        const today = new Date().toISOString().slice(0, 10);
        const article = {
          id: String(nextId++),
          slug,
          title: item.title,
          summary: item.summary || item.title,
          content: null,
          company: feed.company,
          category: feed.category,
          date: today, // aibrief 등록일 (TODAY 뱃지 기준)
          tags: [feed.company],
          imageUrl: null,
          sourceUrl: item.link,
          sourceName: feed.sourceName,
          sources: [{ url: item.link, name: feed.sourceName }],
          communityReaction: null,
          communityLinks: null,
          type: "outlink",
          hidden: action === "draft",
        };

        if (action === "publish") toPublish.push(article);
        else toDraft.push(article);
        added++;
      }

      console.log(`완료 (신규 ${added}개)`);
    } catch (e) {
      console.log(`오류: ${e.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`자동 발행: ${toPublish.length}개`);
  toPublish.forEach((a) => console.log(`  ✅ [발행] ${a.title}`));
  console.log(`드래프트: ${toDraft.length}개`);
  toDraft.forEach((a) => console.log(`  📝 [드래프트] ${a.title}`));

  if (!DRY_RUN && (toPublish.length + toDraft.length > 0)) {
    const newArticles = [...toPublish, ...toDraft];
    const updated = [...newArticles, ...articles];
    fs.writeFileSync(ARTICLES_PATH, JSON.stringify(updated, null, 2), "utf-8");
    console.log(`\n✔ articles.json 저장 완료 (${newArticles.length}개 추가)`);
  } else if (DRY_RUN) {
    console.log("\n(dry-run: 저장 생략)");
  } else {
    console.log("\n신규 항목 없음.");
  }
}

main().catch(console.error);
