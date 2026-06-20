#!/usr/bin/env node
/**
 * AI Brief 뉴스 수집 스크립트
 *
 * 사용법:
 *   node scripts/collect-news.js
 *
 * 각 회사의 공식 RSS/Atom 피드를 읽어 최신 기사 목록을 출력합니다.
 * 출력된 기사를 참고해 data/articles.json에 직접 추가하세요.
 */

const https = require("https");
const http = require("http");

// ===== 수집 대상 피드 목록 =====
// 각 회사의 공식 블로그/뉴스룸 RSS 피드
const FEEDS = [
  // AI 모델
  {
    company: "Anthropic",
    category: "AI모델",
    name: "Anthropic News",
    url: "https://www.anthropic.com/rss.xml",
  },
  {
    company: "OpenAI",
    category: "AI모델",
    name: "OpenAI News",
    url: "https://openai.com/news/rss.xml",
  },
  {
    company: "Google",
    category: "AI모델",
    name: "Google DeepMind Blog",
    url: "https://deepmind.google/blog/rss.xml",
  },
  {
    company: "Google",
    category: "AI모델",
    name: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
  },
  // 디자인툴
  {
    company: "Adobe",
    category: "디자인툴",
    name: "Adobe Blog",
    url: "https://blog.adobe.com/en/rss",
  },
  {
    company: "Canva",
    category: "디자인툴",
    name: "Canva Newsroom",
    url: "https://www.canva.com/newsroom/rss.xml",
  },
  {
    company: "Freepik",
    category: "디자인툴",
    name: "Magnific/Freepik Blog",
    url: "https://www.freepik.com/blog/rss",
  },
  {
    company: "미리캔버스",
    category: "디자인툴",
    name: "미리캔버스 공식 블로그",
    url: "https://blog.miricanvas.com/rss",
  },
  {
    company: "망고보드",
    category: "디자인툴",
    name: "망고보드 트렌드 블로그",
    url: "https://trend.mangoboard.net/news/?feed=rss2",
  },
];

// ===== 수동 확인 체크리스트 =====
// RSS가 없거나 누락이 잦은 소스는 수동으로 확인
const MANUAL_SOURCES = [
  {
    company: "Anthropic",
    name: "Anthropic 공식 뉴스룸",
    url: "https://www.anthropic.com/news",
    note: "모든 모델 출시·정책 발표",
  },
  {
    company: "OpenAI",
    name: "OpenAI ChatGPT Release Notes",
    url: "https://help.openai.com/en/articles/6825453-chatgpt-release-notes",
    note: "ChatGPT 업데이트 전체 목록",
  },
  {
    company: "OpenAI",
    name: "OpenAI API Changelog",
    url: "https://platform.openai.com/docs/changelog",
    note: "API·모델 출시 상세",
  },
  {
    company: "Google",
    name: "Gemini API Release Notes",
    url: "https://ai.google.dev/gemini-api/docs/changelog",
    note: "Gemini 모델 버전 업데이트",
  },
  {
    company: "Adobe",
    name: "Adobe Firefly What's New",
    url: "https://helpx.adobe.com/firefly/web/whats-new/new-features/whats-new.html",
    note: "Firefly 기능 업데이트 전체",
  },
  {
    company: "Adobe",
    name: "Adobe 뉴스룸",
    url: "https://news.adobe.com/",
    note: "Adobe MAX, Summit 등 주요 발표",
  },
  {
    company: "Canva",
    name: "Canva 뉴스룸",
    url: "https://www.canva.com/newsroom/",
    note: "Canva 제품 발표",
  },
  {
    company: "망고보드",
    name: "망고보드 트렌드 블로그",
    url: "https://trend.mangoboard.net/news/",
    note: "망고보드 신기능·업데이트",
  },
  {
    company: "미리캔버스",
    name: "미리캔버스 공식 블로그",
    url: "https://blog.miricanvas.com/",
    note: "미리캔버스 업데이트",
  },
];

// ===== 서드파티 뉴스 집계 소스 =====
// 공식 소스가 놓친 것을 잡아주는 보조 소스
const AGGREGATOR_SOURCES = [
  {
    name: "ScriptByAI — Claude Timeline",
    url: "https://www.scriptbyai.com/anthropic-claude-timeline/",
    focus: "Anthropic 전체 릴리즈 타임라인",
  },
  {
    name: "ScriptByAI — ChatGPT Timeline",
    url: "https://www.scriptbyai.com/timeline-of-chatgpt/",
    focus: "OpenAI/ChatGPT 전체 릴리즈 타임라인",
  },
  {
    name: "Releasebot — Adobe Firefly",
    url: "https://releasebot.io/updates/adobe/firefly",
    focus: "Adobe Firefly 상세 업데이트 추적",
  },
  {
    name: "LLM Stats — AI Updates Today",
    url: "https://llm-stats.com/llm-updates",
    focus: "전체 AI 모델 릴리즈 현황",
  },
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    focus: "AI 업계 전반 주요 뉴스",
  },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "AIBrief/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve(fetchUrl(res.headers.location));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      block.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
    const desc = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
      block.match(/<description>(.*?)<\/description>/) || [])[1] || "";

    const dateObj = pubDate ? new Date(pubDate) : null;
    const cutoff = new Date("2025-01-01");
    if (dateObj && dateObj < cutoff) continue; // 2025년 이전 제외

    items.push({
      title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(),
      link: link.trim(),
      date: dateObj ? dateObj.toISOString().slice(0, 10) : "날짜 불명",
      summary: desc.replace(/<[^>]+>/g, "").slice(0, 120).trim(),
    });
  }
  return items.slice(0, 10); // 최신 10개
}

async function main() {
  console.log("=".repeat(60));
  console.log("AI Brief 뉴스 수집 스크립트");
  console.log("실행 날짜:", new Date().toISOString().slice(0, 10));
  console.log("=".repeat(60));

  console.log("\n[RSS 피드 자동 수집]\n");

  for (const feed of FEEDS) {
    process.stdout.write(`▶ ${feed.company} (${feed.name})... `);
    try {
      const xml = await fetchUrl(feed.url);
      const items = parseRSSItems(xml);
      if (items.length === 0) {
        console.log("항목 없음 또는 파싱 실패");
        continue;
      }
      console.log(`${items.length}개 항목 발견`);
      for (const item of items) {
        console.log(`  [${item.date}] ${item.title}`);
        if (item.link) console.log(`    → ${item.link}`);
      }
    } catch (e) {
      console.log(`오류: ${e.message}`);
    }
    console.log();
  }

  console.log("\n" + "=".repeat(60));
  console.log("[수동 확인 필요 소스 목록]\n");
  console.log("아래 URL을 직접 방문해 최신 기사를 확인하세요:\n");
  for (const src of MANUAL_SOURCES) {
    console.log(`[${src.company}] ${src.name}`);
    console.log(`  ${src.url}`);
    console.log(`  ★ ${src.note}`);
    console.log();
  }

  console.log("=".repeat(60));
  console.log("[서드파티 집계 소스 (보조)]\n");
  for (const src of AGGREGATOR_SOURCES) {
    console.log(`• ${src.name}`);
    console.log(`  ${src.url}`);
    console.log(`  ${src.focus}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("완료! 위 기사들을 참고해 data/articles.json에 추가하세요.");
}

main().catch(console.error);
