// -*- coding: utf-8 -*-
/**
 * 매일 AI·IT 뉴스를 다양한 소스에서 수집하고
 * Claude API로 한국어 기사를 자동 생성합니다.
 *
 * 우선 수집 대상: Adobe, Canva, 미리캔버스, 망고보드
 * 추가 수집 대상: Anthropic, OpenAI, Google 등 + 글로벌/국내 IT 미디어
 */

import Anthropic from '@anthropic-ai/sdk';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ───────────────────────────────────────────
// 우선순위 회사 (Adobe, Canva, 미리캔버스, 망고보드)
// ───────────────────────────────────────────
const PRIORITY_SOURCES = [
  {
    company: 'Adobe',
    category: '디자인툴',
    rssUrls: [
      'https://blog.adobe.com/en/feed',
      'https://blog.adobe.com/feed',
      'https://news.adobe.com/rss.xml',
    ],
    scrapeUrls: [],
    maxItems: 10,
    dayWindow: 7,
  },
  {
    company: 'Canva',
    category: '디자인툴',
    rssUrls: [
      'https://www.canva.com/newsroom/feed/',
      'https://www.canva.com/newsroom/rss.xml',
    ],
    scrapeUrls: [],
    maxItems: 10,
    dayWindow: 7,
  },
  {
    company: '미리캔버스',
    category: '디자인툴',
    rssUrls: [
      'https://rss.blog.naver.com/miricanvas.xml',
      'https://www.miricanvas.com/ko/blog/rss',
      'https://www.miricanvas.com/blog/rss',
    ],
    scrapeUrls: [
      'https://www.miricanvas.com/ko/blog',
      'https://blog.naver.com/miricanvas',
    ],
    maxItems: 10,
    dayWindow: 30, // 국내 업체는 업데이트 주기가 길 수 있어 30일로 확장
  },
  {
    company: '망고보드',
    category: '디자인툴',
    rssUrls: [
      'https://rss.blog.naver.com/mangoboard.xml',
      'https://mangoboard.net/blog/rss',
      'https://mangoboard.net/news/rss',
    ],
    scrapeUrls: [
      'https://mangoboard.net/news/',
      'https://blog.naver.com/mangoboard',
    ],
    maxItems: 10,
    dayWindow: 30,
  },
];

// ───────────────────────────────────────────
// 일반 회사별 공식 소스
// ───────────────────────────────────────────
const COMPANY_SOURCES = [
  {
    company: 'Anthropic',
    category: 'AI모델',
    rssUrls: ['https://www.anthropic.com/rss.xml', 'https://anthropic.com/index.xml'],
    maxItems: 5,
    dayWindow: 3,
  },
  {
    company: 'OpenAI',
    category: 'AI모델',
    rssUrls: ['https://openai.com/news/rss.xml', 'https://openai.com/blog/rss.xml'],
    maxItems: 5,
    dayWindow: 3,
  },
  {
    company: 'Google',
    category: 'AI모델',
    rssUrls: [
      'https://blog.google/technology/ai/rss/',
      'https://deepmind.google/discover/blog/rss/',
      'https://developers.googleblog.com/feeds/posts/default',
    ],
    maxItems: 5,
    dayWindow: 3,
  },
  {
    company: 'Freepik',
    category: '디자인툴',
    rssUrls: ['https://www.freepik.com/blog/feed/'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'ElevenLabs',
    category: 'AI모델',
    rssUrls: ['https://elevenlabs.io/blog/rss.xml', 'https://elevenlabs.io/blog/feed.xml'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'Suno',
    category: 'AI모델',
    rssUrls: ['https://suno.com/blog/rss.xml'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'Getty Images',
    category: '이미지',
    rssUrls: ['https://newsroom.gettyimages.com/en/rss.xml', 'https://newsroom.gettyimages.com/rss.xml'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'Shutterstock',
    category: '이미지',
    rssUrls: ['https://investor.shutterstock.com/rss.xml'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'Monotype',
    category: '폰트',
    rssUrls: ['https://www.monotype.com/rss.xml', 'https://www.monotype.com/news/rss'],
    maxItems: 3,
    dayWindow: 3,
  },
];

// ───────────────────────────────────────────
// 글로벌 IT 미디어
// ───────────────────────────────────────────
const MEDIA_SOURCES = [
  {
    name: 'TechCrunch AI',
    rssUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    keywords: ['anthropic', 'openai', 'google', 'gemini', 'claude', 'gpt', 'canva', 'adobe', 'firefly', 'elevenlabs', 'suno', 'getty', 'shutterstock'],
  },
  {
    name: 'The Verge AI',
    rssUrl: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    keywords: ['anthropic', 'openai', 'google', 'claude', 'gpt', 'gemini', 'canva', 'adobe'],
  },
  {
    name: 'VentureBeat AI',
    rssUrl: 'https://venturebeat.com/category/ai/feed/',
    keywords: ['anthropic', 'openai', 'google deepmind', 'claude', 'gpt-', 'gemini', 'canva', 'adobe firefly'],
  },
  {
    name: 'Wired AI',
    rssUrl: 'https://www.wired.com/feed/tag/ai/latest/rss',
    keywords: ['anthropic', 'openai', 'google', 'claude', 'gpt', 'gemini', 'adobe', 'canva'],
  },
  {
    name: 'Creative Bloq',
    rssUrl: 'https://www.creativebloq.com/feeds/all.xml',
    keywords: ['adobe', 'canva', 'freepik', 'getty', 'shutterstock', 'monotype', 'font', 'ai design'],
  },
  {
    name: 'PR Newswire Tech',
    rssUrl: 'https://www.prnewswire.com/rss/technology-latest-news.rss',
    keywords: ['anthropic', 'openai', 'adobe', 'canva', 'shutterstock', 'getty', 'elevenlabs', 'suno', 'monotype'],
  },
];

// ───────────────────────────────────────────
// 국내 IT 미디어
// ───────────────────────────────────────────
const KOREAN_SOURCES = [
  {
    name: 'AI타임스',
    rssUrl: 'https://www.aitimes.com/rss/allArticle.xml',
    keywords: ['앤트로픽', '오픈AI', '구글', '어도비', '캔바', '망고보드', '미리캔버스', '산돌', '윤디자인', '눈누', 'claude', 'gpt', 'gemini', 'adobe', 'canva'],
  },
  {
    name: '디지털데일리',
    rssUrl: 'https://www.ddaily.co.kr/rss/allArticle.xml',
    keywords: ['anthropic', 'openai', '생성AI', 'AI 모델', '망고보드', '미리캔버스', '산돌', '어도비', '캔바'],
  },
  {
    name: '전자신문',
    rssUrl: 'https://rss.etnews.com/Section901.xml',
    keywords: ['AI', 'anthropic', 'openai', '구글', '어도비', '캔바', '망고보드', '미리캔버스'],
  },
  {
    name: '디자인정글',
    rssUrl: 'https://www.jungle.co.kr/rss/allArticle.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '폰트', '디자인', 'AI'],
  },
  {
    name: '매드타임스',
    rssUrl: 'https://www.madtimes.co.kr/rss/allArticle.xml',
    keywords: ['산돌', '윤디자인', 'AI 폰트', '망고보드', '미리캔버스', '어도비', '캔바'],
  },
];

// ───────────────────────────────────────────
// RSS 파싱 유틸
// ───────────────────────────────────────────
async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIBriefBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith('<')) return null;

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(text);

    const rssItems = parsed?.rss?.channel?.item;
    if (rssItems) return Array.isArray(rssItems) ? rssItems : [rssItems];

    const atomEntries = parsed?.feed?.entry;
    if (atomEntries) return Array.isArray(atomEntries) ? atomEntries : [atomEntries];

    return null;
  } catch {
    return null;
  }
}

// 블로그 페이지 직접 스크래핑 (RSS 없는 국내 업체용)
async function scrapeArticleLinks(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // href에서 블로그 포스트 링크 추출 (일반적인 패턴)
    const linkPatterns = [
      /href="(https?:\/\/[^"]*(?:blog|news|notice|post|article)[^"]*\/\d+[^"]*)"/gi,
      /href="(\/(?:blog|news|notice|post)[^"]*\/\d+[^"]*)"/gi,
      /href="(https?:\/\/blog\.naver\.com\/[^"]+\/\d+)"/gi,
    ];

    const seen = new Set();
    const links = [];
    const baseUrl = new URL(url).origin;

    for (const pattern of linkPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(html)) !== null) {
        let href = match[1];
        if (href.startsWith('/')) href = baseUrl + href;
        if (!seen.has(href)) {
          seen.add(href);
          // 페이지당 10개까지만
          if (links.length < 10) links.push(href);
        }
      }
    }

    // 페이지 타이틀도 추출해서 RSS item 형식으로 변환
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);

    if (links.length === 0) return null;

    // 링크들을 RSS item 형식으로 반환
    return links.slice(0, 5).map((link, i) => ({
      link,
      title: i === 0 && (ogTitle?.[1] || titleMatch?.[1]) ? (ogTitle?.[1] || titleMatch?.[1]) : link,
      description: i === 0 && ogDesc?.[1] ? ogDesc[1] : '',
      pubDate: new Date().toISOString(), // 날짜 불명이면 오늘로
      _scraped: true,
    }));
  } catch {
    return null;
  }
}

// 스크래핑한 링크의 본문 내용 가져오기
async function fetchArticleContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const title = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1]
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
      || '';
    const description = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1]
      || html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1]
      || '';

    // 본문 텍스트 추출 (스크립트/스타일 제거 후)
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1500);

    return { title, description: description || bodyText };
  } catch {
    return null;
  }
}

function extractLink(item) {
  if (typeof item.link === 'string') return item.link;
  if (item.link?.['#text']) return item.link['#text'];
  if (item.link?.['@_href']) return item.link['@_href'];
  if (typeof item.id === 'string' && item.id.startsWith('http')) return item.id;
  return null;
}

function extractDate(item) {
  const raw = item.pubDate || item.published || item.updated || item['dc:date'];
  if (!raw) return new Date();
  try { return new Date(raw); } catch { return new Date(); }
}

function extractTitle(item) {
  if (typeof item.title === 'string') return item.title;
  if (item.title?.['#text']) return item.title['#text'];
  return '';
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractDescription(item) {
  return stripHtml(
    item.description ||
    item.summary ||
    item['content:encoded'] ||
    item.content?.['#text'] ||
    ''
  ).slice(0, 800);
}

function matchesKeywords(item, keywords) {
  const text = (extractTitle(item) + ' ' + extractDescription(item)).toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

function inferCompanyCategory(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  const map = [
    { keywords: ['anthropic', 'claude'], company: 'Anthropic', category: 'AI모델' },
    { keywords: ['openai', 'chatgpt', 'gpt-'], company: 'OpenAI', category: 'AI모델' },
    { keywords: ['google', 'gemini', 'deepmind'], company: 'Google', category: 'AI모델' },
    { keywords: ['canva', '캔바'], company: 'Canva', category: '디자인툴' },
    { keywords: ['adobe', 'firefly', 'photoshop', 'premiere', '어도비'], company: 'Adobe', category: '디자인툴' },
    { keywords: ['미리캔버스', 'miricanvas'], company: '미리캔버스', category: '디자인툴' },
    { keywords: ['망고보드', 'mangoboard'], company: '망고보드', category: '디자인툴' },
    { keywords: ['freepik'], company: 'Freepik', category: '디자인툴' },
    { keywords: ['elevenlabs'], company: 'ElevenLabs', category: 'AI모델' },
    { keywords: ['suno'], company: 'Suno', category: 'AI모델' },
    { keywords: ['getty'], company: 'Getty Images', category: '이미지' },
    { keywords: ['shutterstock'], company: 'Shutterstock', category: '이미지' },
    { keywords: ['monotype', 'myfonts'], company: 'Monotype', category: '폰트' },
    { keywords: ['산돌', 'sandoll'], company: '산돌', category: '폰트' },
    { keywords: ['윤디자인', 'yoondesign'], company: '윤디자인', category: '폰트' },
  ];
  for (const entry of map) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      return { company: entry.company, category: entry.category };
    }
  }
  return { company: 'AI·IT', category: 'AI모델' };
}

// ───────────────────────────────────────────
// Claude API로 한국어 기사 생성
// ───────────────────────────────────────────
async function generateArticle(company, category, item, sourceName) {
  const title = extractTitle(item);
  const link = extractLink(item);
  const pubDate = extractDate(item);
  const description = extractDescription(item);

  const prompt = `당신은 AI·IT 전문 뉴스 에디터입니다. 아래 기사를 한국어 기사로 변환해주세요.

[입력 정보]
회사: ${company}
카테고리: ${category}
출처: ${sourceName}
원문 제목: ${title}
원문 URL: ${link}
원문 요약: ${description}

[출력 형식 - JSON만 출력]
{
  "title": "한국어 제목 — 회사명 + 핵심 내용 (예: Adobe, Firefly 4 출시 — 이미지 생성 품질 대폭 향상)",
  "summary": "2~3문장 한국어 요약. 무엇이 출시/발표됐고, 핵심 의의는 무엇인지.",
  "content": "## 배경\\n(이 발표의 맥락)\\n\\n## 주요 내용\\n- 핵심 사항 1\\n- 핵심 사항 2\\n- 핵심 사항 3\\n\\n## 시장 영향\\n(업계·사용자에 미치는 영향)",
  "tags": ["태그1", "태그2", "태그3", "태그4"],
  "communityReaction": "디자이너·개발자 커뮤니티의 예상 반응 1~2문장."
}

주의: JSON 외 텍스트 출력 금지. 모든 필드 한국어.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/, '');

  const json = JSON.parse(raw);
  const dateStr = pubDate.toISOString().split('T')[0];
  const hash = createHash('md5').update(link || title).digest('hex').slice(0, 8);
  const slug = `${company.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-')}-${hash}-${dateStr}`;

  return {
    title: json.title,
    summary: json.summary,
    content: json.content,
    company,
    category,
    date: dateStr,
    tags: json.tags || [],
    imageUrl: null,
    sourceUrl: link,
    sourceName,
    sources: [{ url: link, name: `${sourceName} — ${title}` }],
    communityReaction: json.communityReaction || null,
    slug,
  };
}

// ───────────────────────────────────────────
// 우선순위 소스 처리 (Adobe, Canva, 미리캔버스, 망고보드)
// ───────────────────────────────────────────
async function processPrioritySource(source, existingUrls, existingSlugs, nextId, newArticles) {
  const windowMs = source.dayWindow * 24 * 60 * 60 * 1000;
  console.log(`\n⭐ [우선] ${source.company} 수집 중...`);

  // 1. RSS 시도
  let items = null;
  for (const url of source.rssUrls) {
    items = await fetchRSS(url);
    if (items) { console.log(`  ✓ RSS: ${url}`); break; }
  }

  // 2. RSS 실패 시 직접 스크래핑
  if (!items && source.scrapeUrls?.length > 0) {
    console.log(`  ℹ️  RSS 없음 — 페이지 스크래핑 시도`);
    for (const url of source.scrapeUrls) {
      const scraped = await scrapeArticleLinks(url);
      if (scraped && scraped.length > 0) {
        console.log(`  ✓ 스크래핑: ${url} (${scraped.length}개 링크)`);
        // 스크래핑된 링크의 실제 내용 가져오기
        items = [];
        for (const s of scraped) {
          const content = await fetchArticleContent(s.link);
          if (content && content.title) {
            items.push({
              link: s.link,
              title: content.title,
              description: content.description,
              pubDate: new Date().toISOString(),
            });
          }
        }
        if (items.length > 0) break;
      }
    }
  }

  if (!items || items.length === 0) {
    console.log(`  ⚠️  ${source.company}: 수집 실패`);
    return nextId;
  }

  for (const item of items.slice(0, source.maxItems)) {
    const link = extractLink(item);
    if (link && existingUrls.has(link)) continue;
    const age = Date.now() - extractDate(item).getTime();
    if (age > windowMs) continue;

    console.log(`  ✍️  ${extractTitle(item).slice(0, 70)}`);
    try {
      const article = await generateArticle(source.company, source.category, item, `${source.company} 공식`);
      if (!existingSlugs.has(article.slug)) {
        article.id = String(nextId++);
        newArticles.push(article);
        if (link) existingUrls.add(link);
        existingSlugs.add(article.slug);
      }
      await new Promise(r => setTimeout(r, 800));
    } catch (e) { console.error(`    ❌ ${e.message}`); }
  }

  return nextId;
}

// ───────────────────────────────────────────
// 메인
// ───────────────────────────────────────────
async function main() {
  const articles = JSON.parse(readFileSync('data/articles.json', 'utf-8'));
  const existingUrls = new Set(
    articles.flatMap(a => [a.sourceUrl, ...(a.sources?.map(s => s.url) || [])]).filter(Boolean)
  );
  const existingSlugs = new Set(articles.map(a => a.slug));
  let nextId = Math.max(...articles.map(a => parseInt(a.id) || 0)) + 1;
  const newArticles = [];

  // ── 1단계: 우선순위 회사 (Adobe, Canva, 미리캔버스, 망고보드) ──
  console.log('\n🎯 우선순위 회사 수집 시작 (Adobe, Canva, 미리캔버스, 망고보드)');
  for (const source of PRIORITY_SOURCES) {
    nextId = await processPrioritySource(source, existingUrls, existingSlugs, nextId, newArticles);
  }

  // ── 2단계: 일반 회사 공식 소스 ──
  console.log('\n📡 일반 회사 공식 블로그/뉴스룸 수집 중...');
  for (const source of COMPANY_SOURCES) {
    const windowMs = source.dayWindow * 24 * 60 * 60 * 1000;
    let items = null;
    for (const url of source.rssUrls) {
      items = await fetchRSS(url);
      if (items) { console.log(`  ✓ ${source.company}: ${url}`); break; }
    }
    if (!items) { console.log(`  ⚠️  ${source.company}: RSS 없음`); continue; }

    for (const item of items.slice(0, source.maxItems)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      const age = Date.now() - extractDate(item).getTime();
      if (age > windowMs) continue;

      console.log(`  ✍️  [${source.company}] ${extractTitle(item).slice(0, 60)}`);
      try {
        const article = await generateArticle(source.company, source.category, item, `${source.company} 공식 블로그`);
        if (!existingSlugs.has(article.slug)) {
          article.id = String(nextId++);
          newArticles.push(article);
          if (link) existingUrls.add(link);
          existingSlugs.add(article.slug);
        }
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { console.error(`    ❌ ${e.message}`); }
    }
  }

  // ── 3단계: 글로벌 IT 미디어 ──
  console.log('\n🌐 글로벌 IT 미디어 수집 중...');
  for (const source of MEDIA_SOURCES) {
    const items = await fetchRSS(source.rssUrl);
    if (!items) { console.log(`  ⚠️  ${source.name}: RSS 없음`); continue; }

    const relevant = items.filter(item => matchesKeywords(item, source.keywords));
    console.log(`  ✓ ${source.name}: ${items.length}개 중 ${relevant.length}개 관련`);

    for (const item of relevant.slice(0, 3)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      const age = Date.now() - extractDate(item).getTime();
      if (age > 3 * 24 * 60 * 60 * 1000) continue;

      const title = extractTitle(item);
      const desc = extractDescription(item);
      const { company, category } = inferCompanyCategory(title, desc);

      console.log(`  ✍️  [${company}] ${title.slice(0, 60)}`);
      try {
        const article = await generateArticle(company, category, item, source.name);
        if (!existingSlugs.has(article.slug)) {
          article.id = String(nextId++);
          newArticles.push(article);
          if (link) existingUrls.add(link);
          existingSlugs.add(article.slug);
        }
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { console.error(`    ❌ ${e.message}`); }
    }
  }

  // ── 4단계: 국내 IT 미디어 ──
  console.log('\n🇰🇷 국내 IT 미디어 수집 중...');
  for (const source of KOREAN_SOURCES) {
    const items = await fetchRSS(source.rssUrl);
    if (!items) { console.log(`  ⚠️  ${source.name}: RSS 없음`); continue; }

    const relevant = items.filter(item => matchesKeywords(item, source.keywords));
    console.log(`  ✓ ${source.name}: ${items.length}개 중 ${relevant.length}개 관련`);

    for (const item of relevant.slice(0, 3)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      const age = Date.now() - extractDate(item).getTime();
      if (age > 3 * 24 * 60 * 60 * 1000) continue;

      const title = extractTitle(item);
      const desc = extractDescription(item);
      const { company, category } = inferCompanyCategory(title, desc);

      console.log(`  ✍️  [${company}] ${title.slice(0, 60)}`);
      try {
        const article = await generateArticle(company, category, item, source.name);
        if (!existingSlugs.has(article.slug)) {
          article.id = String(nextId++);
          newArticles.push(article);
          if (link) existingUrls.add(link);
          existingSlugs.add(article.slug);
        }
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { console.error(`    ❌ ${e.message}`); }
    }
  }

  // 결과 저장
  if (newArticles.length > 0) {
    const updated = [...articles, ...newArticles];
    writeFileSync('data/articles.json', JSON.stringify(updated, null, 2), 'utf-8');
    console.log(`\n✅ 완료: ${newArticles.length}개 기사 추가 (총 ${updated.length}개)`);
    newArticles.forEach(a => console.log(`   • [${a.company}] ${a.title}`));
  } else {
    console.log('\n✅ 새 기사 없음 — 업데이트 불필요');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
