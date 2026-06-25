// 산돌 + Adobe 과거 기사 수집 스크립트 (dayWindow 무시, Jan 2025 이후)
// 사용: node scripts/collect-sandoll-historical.mjs

import Anthropic from '@anthropic-ai/sdk';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const ARTICLES_PATH = './data/articles.json';
const MIN_DATE = new Date('2025-01-01');

// 제외 키워드 (auto-collect.mjs와 동일)
const EXCLUDE_KEYWORDS = [
  'esg', '봉사활동', '사회공헌', '채용', '공개채용', '임직원',
  '주주총회', '소각', '배당', '공시', '감사인', '사업보고서', '분기보고서', '밸류업', '주주환원',
  '무상증자', '신주발행', '권리주주', '기준일',
  '국가ai전략', '입법', '규제', '법안', '위원회',
  '헬스케어', '의료', '바이오', '병원',
  '군사', '방산', '국방',
];

function isExcluded(title, desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  return EXCLUDE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

async function fetchRSS(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIBriefBot/1.0)', Accept: 'application/rss+xml, application/xml, */*' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    const data = parser.parse(text);
    const items = data?.rss?.channel?.item || data?.feed?.entry || [];
    return Array.isArray(items) ? items : [items];
  } catch { return null; }
}

function getLink(item) {
  if (typeof item.link === 'string') return item.link;
  if (item.link?.['#text']) return item.link['#text'];
  if (item.link?.['@_href']) return item.link['@_href'];
  if (typeof item.id === 'string' && item.id.startsWith('http')) return item.id;
  return null;
}

function getTitle(item) {
  if (typeof item.title === 'string') return item.title.trim();
  if (item.title?.['#text']) return item.title['#text'].trim();
  return '';
}

function getDate(item) {
  const raw = item.pubDate || item.published || item.updated || item['dc:date'] || '';
  if (raw) { const d = new Date(raw); if (!isNaN(d)) return d; }
  return new Date();
}

function getDesc(item) {
  if (typeof item.description === 'string') return item.description.slice(0, 500);
  if (typeof item.summary === 'string') return item.summary.slice(0, 500);
  return '';
}

async function fetchContent(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'text/html', 'Accept-Language': 'ko-KR,ko;q=0.9' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || '';
    const ogDesc = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1] || '';
    const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
    return { title: ogTitle, description: ogDesc || bodyText };
  } catch { return null; }
}

async function generateArticle(company, category, title, link, pubDate, description) {
  const prompt = `당신은 디자이너와 크리에이터를 위한 AI 뉴스 큐레이터입니다.
다음 뉴스 기사를 한국어로 요약·정리해 JSON으로 반환하세요.

회사: ${company}
카테고리: ${category}
제목: ${title}
링크: ${link}
날짜: ${pubDate.toISOString().split('T')[0]}
설명: ${description}

JSON 형식:
{
  "title": "한국어 제목 (60자 이내, 회사명 포함, 핵심 내용 담기)",
  "summary": "한국어 요약 (2~3문장, 디자이너/크리에이터 관점)",
  "content": "한국어 본문 (200~300자, 실무 활용 관점)",
  "tags": ["태그1", "태그2", "태그3"]
}`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].text;
  const match = text.match(/\{[\s\S]+\}/);
  if (!match) throw new Error('JSON parse fail');
  return JSON.parse(match[0]);
}

const SOURCES = [
  {
    company: '산돌',
    category: '디자인툴',
    rssUrls: ['https://www.sandoll.co.kr/rss', 'https://sandoll.co.kr/news/rss'],
  },
  {
    company: 'Adobe',
    category: '디자인툴',
    rssUrls: ['https://blog.adobe.com/en/feed', 'https://news.adobe.com/rss.xml'],
  },
];

const ADOBE_KEYWORDS = ['firefly', 'photoshop', 'illustrator', 'premiere', 'express', 'creative cloud', 'ai', 'genai', 'font', 'video', 'audio', 'image', 'design'];

async function main() {
  const raw = readFileSync(ARTICLES_PATH, 'utf8');
  const articles = JSON.parse(raw);
  const existingUrls = new Set(articles.map(a => a.sourceUrl).filter(Boolean));
  const existingSlugs = new Set(articles.map(a => a.slug));
  let nextId = Math.max(...articles.map(a => parseInt(a.id) || 0)) + 1;
  const newArticles = [];

  for (const source of SOURCES) {
    console.log(`\n수집 중: ${source.company}`);
    let items = null;
    for (const url of source.rssUrls) {
      items = await fetchRSS(url);
      if (items && items.length > 0) { console.log(`  ✓ RSS: ${url} (${items.length}개)`); break; }
    }
    if (!items) { console.log(`  ✗ RSS 실패`); continue; }

    for (const item of items) {
      const link = getLink(item);
      const title = getTitle(item);
      const pubDate = getDate(item);
      const desc = getDesc(item);

      if (!link || !title) continue;
      if (pubDate < MIN_DATE) continue;
      if (existingUrls.has(link)) { console.log(`  skip (기존): ${title.slice(0, 50)}`); continue; }
      if (isExcluded(title, desc)) { console.log(`  skip (제외): ${title.slice(0, 50)}`); continue; }

      // Adobe는 키워드 필터 적용
      if (source.company === 'Adobe') {
        const text = (title + ' ' + desc).toLowerCase();
        if (!ADOBE_KEYWORDS.some(kw => text.includes(kw))) {
          console.log(`  skip (키워드없음): ${title.slice(0, 50)}`);
          continue;
        }
      }

      console.log(`  ✍️  ${title.slice(0, 70)}`);
      try {
        // 원문 내용 가져오기
        let content = await fetchContent(link);
        const finalTitle = content?.title || title;
        const finalDesc = content?.description || desc;

        const json = await generateArticle(source.company, source.category, finalTitle, link, pubDate, finalDesc);

        const dateStr = pubDate.toISOString().split('T')[0];
        const hash = createHash('md5').update(link).digest('hex').slice(0, 8);
        const slug = `${source.company.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-')}-${hash}-${dateStr}`;

        if (existingSlugs.has(slug)) { console.log(`    slug 충돌 skip`); continue; }

        const article = {
          id: String(nextId++),
          title: json.title,
          summary: json.summary,
          content: json.content,
          company: source.company,
          category: source.category,
          date: dateStr,
          tags: json.tags || [],
          imageUrl: null,
          sourceUrl: link,
          sourceName: `${source.company} 공식`,
          sources: [{ url: link, name: `${source.company} — ${finalTitle}` }],
          communityReaction: null,
          communityLinks: null,
          slug,
        };

        newArticles.push(article);
        existingUrls.add(link);
        existingSlugs.add(slug);
        console.log(`    ✓ 추가: ${json.title.slice(0, 60)}`);

        await new Promise(r => setTimeout(r, 1000)); // rate limit
      } catch (e) {
        console.error(`    ✗ 오류: ${e.message}`);
      }
    }
  }

  if (newArticles.length > 0) {
    const updated = [...articles, ...newArticles].sort((a, b) => new Date(b.date) - new Date(a.date));
    writeFileSync(ARTICLES_PATH, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`\n✅ ${newArticles.length}개 기사 추가 완료!`);
  } else {
    console.log('\n추가할 새 기사 없음');
  }
}

main().catch(console.error);
