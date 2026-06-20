// -*- coding: utf-8 -*-
/**
 * 매일 AI·IT 뉴스를 다양한 소스에서 수집하고
 * Claude API로 한국어 기사를 자동 생성합니다.
 *
 * 수집 소스:
 *   - 각 회사 공식 블로그/뉴스룸 RSS
 *   - TechCrunch, The Verge, VentureBeat 등 글로벌 IT 미디어
 *   - AI타임스, 디지털데일리, 전자신문 등 국내 IT 미디어
 *   - PR Newswire 보도자료
 *   - ScriptByAI, Releasebot 등 AI 전문 집계 사이트
 */

import Anthropic from '@anthropic-ai/sdk';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ───────────────────────────────────────────
// 수집 대상 정의
// ───────────────────────────────────────────

// 회사별 공식 소스
const COMPANY_SOURCES = [
  {
    company: 'Anthropic',
    category: 'AI모델',
    rssUrls: [
      'https://www.anthropic.com/rss.xml',
      'https://anthropic.com/index.xml',
    ],
  },
  {
    company: 'OpenAI',
    category: 'AI모델',
    rssUrls: [
      'https://openai.com/news/rss.xml',
      'https://openai.com/blog/rss.xml',
    ],
  },
  {
    company: 'Google',
    category: 'AI모델',
    rssUrls: [
      'https://blog.google/technology/ai/rss/',
      'https://deepmind.google/discover/blog/rss/',
      'https://developers.googleblog.com/feeds/posts/default',
    ],
  },
  {
    company: 'Canva',
    category: '디자인툴',
    rssUrls: [
      'https://www.canva.com/newsroom/feed/',
      'https://www.canva.com/newsroom/rss.xml',
    ],
  },
  {
    company: 'Adobe',
    category: '디자인툴',
    rssUrls: [
      'https://blog.adobe.com/feed',
      'https://blog.adobe.com/en/feed',
      'https://news.adobe.com/rss.xml',
    ],
  },
  {
    company: 'Freepik',
    category: '디자인툴',
    rssUrls: [
      'https://www.freepik.com/blog/feed/',
    ],
  },
  {
    company: 'ElevenLabs',
    category: 'AI모델',
    rssUrls: [
      'https://elevenlabs.io/blog/rss.xml',
      'https://elevenlabs.io/blog/feed.xml',
    ],
  },
  {
    company: 'Suno',
    category: 'AI모델',
    rssUrls: [
      'https://suno.com/blog/rss.xml',
    ],
  },
  {
    company: 'Getty Images',
    category: '이미지',
    rssUrls: [
      'https://newsroom.gettyimages.com/en/rss.xml',
      'https://newsroom.gettyimages.com/rss.xml',
    ],
  },
  {
    company: 'Shutterstock',
    category: '이미지',
    rssUrls: [
      'https://investor.shutterstock.com/rss.xml',
    ],
  },
  {
    company: 'Monotype',
    category: '폰트',
    rssUrls: [
      'https://www.monotype.com/rss.xml',
      'https://www.monotype.com/news/rss',
    ],
  },
];

// 글로벌 IT 미디어 — 키워드로 관련 기사 필터링
const MEDIA_SOURCES = [
  {
    name: 'TechCrunch AI',
    rssUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    keywords: ['anthropic', 'openai', 'google', 'gemini', 'claude', 'gpt', 'canva', 'adobe', 'firefly', 'midjourney', 'stability', 'elevenlabs', 'suno', 'getty', 'shutterstock'],
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
    name: 'Ars Technica AI',
    rssUrl: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    keywords: ['anthropic', 'openai', 'google ai', 'claude', 'chatgpt', 'gemini'],
  },
  {
    name: 'Wired AI',
    rssUrl: 'https://www.wired.com/feed/tag/ai/latest/rss',
    keywords: ['anthropic', 'openai', 'google', 'claude', 'gpt', 'gemini', 'adobe', 'canva'],
  },
  {
    name: 'Music Business Worldwide',
    rssUrl: 'https://www.musicbusinessworldwide.com/feed/',
    keywords: ['suno', 'elevenlabs', 'udio', 'ai music', 'ai audio'],
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
  {
    name: 'ScriptByAI',
    rssUrl: 'https://www.scriptbyai.com/feed/',
    keywords: ['claude', 'gpt', 'gemini', 'anthropic', 'openai', 'google'],
  },
];

// 국내 IT 미디어
const KOREAN_SOURCES = [
  {
    name: 'AI타임스',
    rssUrl: 'https://www.aitimes.com/rss/allArticle.xml',
    keywords: ['앤트로픽', '오픈AI', '구글', '어도비', '캔바', '망고보드', '미리캔버스', '산돌', '윤디자인', '눈누', 'claude', 'gpt', 'gemini'],
  },
  {
    name: '인공지능신문',
    rssUrl: 'https://www.aitimes.kr/rss/allArticle.xml',
    keywords: ['앤트로픽', '오픈AI', '구글', '어도비', '캔바', '클로드', 'AI 모델', 'AI 디자인'],
  },
  {
    name: '디지털데일리',
    rssUrl: 'https://www.ddaily.co.kr/rss/allArticle.xml',
    keywords: ['anthropic', 'openai', '생성AI', 'AI 모델', '망고보드', '미리캔버스', '산돌'],
  },
  {
    name: '전자신문',
    rssUrl: 'https://rss.etnews.com/Section901.xml',
    keywords: ['AI', 'anthropic', 'openai', '구글', '어도비', '캔바'],
  },
  {
    name: '매드타임스',
    rssUrl: 'https://www.madtimes.co.kr/rss/allArticle.xml',
    keywords: ['산돌', '윤디자인', 'AI 폰트', '망고보드', '미리캔버스'],
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
    { keywords: ['google', 'gemini', 'deepmind', 'nano banana'], company: 'Google', category: 'AI모델' },
    { keywords: ['canva'], company: 'Canva', category: '디자인툴' },
    { keywords: ['adobe', 'firefly', 'photoshop', 'premiere'], company: 'Adobe', category: '디자인툴' },
    { keywords: ['freepik'], company: 'Freepik', category: '디자인툴' },
    { keywords: ['elevenlabs'], company: 'ElevenLabs', category: 'AI모델' },
    { keywords: ['suno'], company: 'Suno', category: 'AI모델' },
    { keywords: ['getty'], company: 'Getty Images', category: '이미지' },
    { keywords: ['shutterstock'], company: 'Shutterstock', category: '이미지' },
    { keywords: ['monotype', 'myfonts'], company: 'Monotype', category: '폰트' },
    { keywords: ['산돌', 'sandoll', 'bakey'], company: '산돌', category: '폰트' },
    { keywords: ['윤디자인', 'yoondesign', '폰코자키'], company: '윤디자인', category: '폰트' },
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

  const prompt = `당신은 AI·IT 전문 뉴스 에디터입니다. 아래 해외 기사를 한국어 기사로 변환해주세요.

[입력 정보]
회사: ${company}
카테고리: ${category}
출처: ${sourceName}
원문 제목: ${title}
원문 URL: ${link}
원문 요약: ${description}

[출력 형식 - JSON만 출력]
{
  "title": "한국어 제목 — 회사명 + 핵심 내용 (예: Anthropic, Claude 4 출시 — 추론 능력 2배 향상)",
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
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  // 1. 회사 공식 소스 수집
  console.log('\n📡 공식 블로그/뉴스룸 수집 중...');
  for (const source of COMPANY_SOURCES) {
    let items = null;
    for (const url of source.rssUrls) {
      items = await fetchRSS(url);
      if (items) { console.log(`  ✓ ${source.company}: ${url}`); break; }
    }
    if (!items) { console.log(`  ⚠️  ${source.company}: RSS 없음`); continue; }

    for (const item of items.slice(0, 5)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      const age = Date.now() - extractDate(item).getTime();
      if (age > THREE_DAYS_MS) continue;

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

  // 2. 글로벌 IT 미디어 수집 (키워드 필터링)
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
      if (age > THREE_DAYS_MS) continue;

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

  // 3. 국내 IT 미디어 수집
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
      if (age > THREE_DAYS_MS) continue;

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
