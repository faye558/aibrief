// -*- coding: utf-8 -*-
/**
 * 매일 AI·IT 뉴스를 다양한 소스에서 수집하고
 * Claude API로 한국어 기사를 자동 생성합니다.
 *
 * 우선순위 (1순위): Adobe, Canva, 미리캔버스, 망고보드, 산돌, 눈누
 * 2순위: Anthropic, OpenAI, Google 등 AI 기업 (기사 수 제한)
 * 3순위: 글로벌 IT 미디어 (디자인툴 키워드 강화)
 * 4순위: 국내 언론 보도자료 전체
 */

import Anthropic from '@anthropic-ai/sdk';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ───────────────────────────────────────────
// 커뮤니티 링크 맵 (회사별 관련 커뮤니티)
// ───────────────────────────────────────────
const COMMUNITY_LINKS = {
  'Freepik':      [
    { name: 'Reddit r/freepik', url: 'https://www.reddit.com/r/freepik/new/' },
    { name: 'Reddit r/graphic_design', url: 'https://www.reddit.com/r/graphic_design/new/' },
    { name: '클리앙 검색: 프리픽', url: 'https://www.clien.net/service/search?q=%ED%94%84%EB%A6%AC%ED%94%BD&sort=latest' },
  ],
  'Adobe':        [
    { name: 'Reddit r/adobe', url: 'https://www.reddit.com/r/adobe/new/' },
    { name: 'Reddit r/graphic_design', url: 'https://www.reddit.com/r/graphic_design/new/' },
    { name: '클리앙 검색: 어도비', url: 'https://www.clien.net/service/search?q=%EC%96%B4%EB%8F%84%EB%B9%84&sort=latest' },
  ],
  'Canva':        [
    { name: 'Reddit r/canva', url: 'https://www.reddit.com/r/canva/new/' },
    { name: 'Reddit r/graphic_design', url: 'https://www.reddit.com/r/graphic_design/new/' },
    { name: '클리앙 검색: 캔바', url: 'https://www.clien.net/service/search?q=%EC%BA%94%EB%B0%94&sort=latest' },
  ],
  '미리캔버스':   [
    { name: '네이버 카페 검색: 미리캔버스', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EB%AF%B8%EB%A6%AC%EC%BA%94%EB%B2%84%EC%8A%A4' },
    { name: '클리앙 검색: 미리캔버스', url: 'https://www.clien.net/service/search?q=%EB%AF%B8%EB%A6%AC%EC%BA%94%EB%B2%84%EC%8A%A4&sort=latest' },
    { name: '디스크립 검색: 미리캔버스', url: 'https://www.disquiet.io/search?q=%EB%AF%B8%EB%A6%AC%EC%BA%94%EB%B2%84%EC%8A%A4' },
  ],
  '망고보드':     [
    { name: '네이버 카페 검색: 망고보드', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EB%A7%9D%EA%B3%A0%EB%B3%B4%EB%93%9C' },
    { name: '클리앙 검색: 망고보드', url: 'https://www.clien.net/service/search?q=%EB%A7%9D%EA%B3%A0%EB%B3%B4%EB%93%9C&sort=latest' },
  ],
  '산돌':         [
    { name: '네이버 카페 검색: 산돌', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EC%82%B0%EB%8F%8C' },
    { name: '네이버 카페 검색: 산돌캔버스', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EC%82%B0%EB%8F%8C%EC%BA%94%EB%B2%84%EC%8A%A4' },
    { name: '클리앙 검색: 산돌', url: 'https://www.clien.net/service/search?q=%EC%82%B0%EB%8F%8C&sort=latest' },
    { name: 'Reddit r/typography', url: 'https://www.reddit.com/r/typography/new/' },
  ],
  '눈누':         [
    { name: '네이버 카페 검색: 눈누', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EB%88%88%EB%88%88%ED%8F%B0%ED%8A%B8' },
    { name: '클리앙 검색: 눈누', url: 'https://www.clien.net/service/search?q=%EB%88%88%EB%88%88&sort=latest' },
  ],
  '윤디자인':     [
    { name: '네이버 카페 검색: 윤디자인', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EC%9C%A4%EB%94%94%EC%9E%90%EC%9D%B8' },
  ],
  'Freepik':      [
    { name: 'Reddit r/graphic_design', url: 'https://www.reddit.com/r/graphic_design/new/' },
    { name: 'Reddit r/freepik', url: 'https://www.reddit.com/r/freepik/new/' },
  ],
  'Anthropic':    [
    { name: 'Reddit r/ClaudeAI', url: 'https://www.reddit.com/r/ClaudeAI/new/' },
    { name: '클리앙 검색: 클로드', url: 'https://www.clien.net/service/search?q=%ED%81%B4%EB%A1%9C%EB%93%9C&sort=latest' },
    { name: '디스크립 검색: Claude', url: 'https://www.disquiet.io/search?q=Claude' },
  ],
  'OpenAI':       [
    { name: 'Reddit r/ChatGPT', url: 'https://www.reddit.com/r/ChatGPT/new/' },
    { name: 'Reddit r/OpenAI', url: 'https://www.reddit.com/r/OpenAI/new/' },
    { name: '클리앙 검색: ChatGPT', url: 'https://www.clien.net/service/search?q=ChatGPT&sort=latest' },
  ],
  'Google':       [
    { name: 'Reddit r/Gemini', url: 'https://www.reddit.com/r/Gemini/new/' },
    { name: 'Reddit r/artificial', url: 'https://www.reddit.com/r/artificial/new/' },
    { name: '클리앙 검색: 제미나이', url: 'https://www.clien.net/service/search?q=%EC%A0%9C%EB%AF%B8%EB%82%98%EC%9D%B4&sort=latest' },
  ],
  'ElevenLabs':   [
    { name: 'Reddit r/ElevenLabs', url: 'https://www.reddit.com/r/ElevenLabs/new/' },
    { name: 'Reddit r/artificial', url: 'https://www.reddit.com/r/artificial/new/' },
  ],
  'Suno':         [
    { name: 'Reddit r/SunoAI', url: 'https://www.reddit.com/r/SunoAI/new/' },
  ],
  'Getty Images': [
    { name: 'Reddit r/photography', url: 'https://www.reddit.com/r/photography/new/' },
    { name: 'Reddit r/stockphotography', url: 'https://www.reddit.com/r/stockphotography/new/' },
  ],
  'Shutterstock': [
    { name: 'Reddit r/stockphotography', url: 'https://www.reddit.com/r/stockphotography/new/' },
  ],
  'Monotype':     [
    { name: 'Reddit r/typography', url: 'https://www.reddit.com/r/typography/new/' },
    { name: 'Reddit r/fonts', url: 'https://www.reddit.com/r/fonts/new/' },
  ],
};

// ───────────────────────────────────────────
// 1순위: 디자인툴·폰트 회사 (최우선)
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
    dayWindow: 30,
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
  {
    company: '산돌',
    category: '디자인툴',  // 캔버스·AI스튜디오 등 디자인툴 사업 포함
    rssUrls: [
      'https://rss.blog.naver.com/sandollcloud.xml',
      'https://rss.blog.naver.com/sandoll_canvas.xml',
      'https://www.sandoll.co.kr/rss',
      'https://sandoll.co.kr/news/rss',
    ],
    scrapeUrls: [
      'https://www.sandoll.co.kr/news',
      'https://blog.naver.com/sandollcloud',
      'https://canvas.sandoll.co.kr',   // 산돌캔버스
      'https://bakey.ai',               // 베이키(Bakey) - 산돌 AI 앱
    ],
    maxItems: 10,
    dayWindow: 60,  // 업데이트 빈도 낮을 수 있어 넉넉하게
  },
  {
    company: '눈누',
    category: '폰트',
    rssUrls: [
      'https://rss.blog.naver.com/noonnu.xml',
      'https://noonnu.cc/rss',
    ],
    scrapeUrls: [
      'https://noonnu.cc/notice',
      'https://blog.naver.com/noonnu',
    ],
    maxItems: 8,
    dayWindow: 30,
  },
  {
    company: 'Freepik',
    category: '디자인툴',
    rssUrls: [
      'https://www.freepik.com/blog/feed/',
      'https://magnific.ai/blog/rss',
      'https://blog.freepik.com/feed/',
    ],
    scrapeUrls: [
      'https://www.freepik.com/blog',
      'https://magnific.ai/blog',
    ],
    maxItems: 10,
    dayWindow: 14,
  },
];

// ───────────────────────────────────────────
// 2순위: AI 기업 공식 소스 (기사 수 축소)
// ───────────────────────────────────────────
const COMPANY_SOURCES = [
  {
    company: 'Anthropic',
    category: 'AI모델',
    rssUrls: ['https://www.anthropic.com/rss.xml', 'https://anthropic.com/index.xml'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'OpenAI',
    category: 'AI모델',
    rssUrls: ['https://openai.com/news/rss.xml', 'https://openai.com/blog/rss.xml'],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'Google',
    category: 'AI모델',
    rssUrls: [
      'https://blog.google/technology/ai/rss/',
      'https://deepmind.google/discover/blog/rss/',
    ],
    maxItems: 3,
    dayWindow: 3,
  },
  {
    company: 'ElevenLabs',
    category: 'AI모델',
    rssUrls: ['https://elevenlabs.io/blog/rss.xml', 'https://elevenlabs.io/blog/feed.xml'],
    maxItems: 2,
    dayWindow: 3,
  },
  {
    company: 'Suno',
    category: 'AI모델',
    rssUrls: ['https://suno.com/blog/rss.xml'],
    maxItems: 2,
    dayWindow: 3,
  },
  {
    company: 'Getty Images',
    category: '이미지',
    rssUrls: ['https://newsroom.gettyimages.com/en/rss.xml'],
    maxItems: 3,
    dayWindow: 7,
  },
  {
    company: 'Shutterstock',
    category: '이미지',
    rssUrls: ['https://investor.shutterstock.com/rss.xml'],
    maxItems: 3,
    dayWindow: 7,
  },
  {
    company: 'Monotype',
    category: '폰트',
    rssUrls: ['https://www.monotype.com/rss.xml', 'https://www.monotype.com/news/rss'],
    maxItems: 3,
    dayWindow: 7,
  },
];

// ───────────────────────────────────────────
// 3순위: 글로벌 IT 미디어 (디자인툴 키워드 강화)
// ───────────────────────────────────────────
const MEDIA_SOURCES = [
  {
    name: 'Creative Bloq',
    rssUrl: 'https://www.creativebloq.com/feeds/all.xml',
    keywords: ['adobe', 'canva', 'freepik', 'getty', 'shutterstock', 'monotype', 'font', 'ai design', 'graphic design', 'design tool'],
    maxItems: 5,
  },
  {
    name: 'TechCrunch AI',
    rssUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    keywords: ['adobe', 'canva', 'firefly', 'anthropic', 'openai', 'google', 'gemini', 'claude', 'gpt', 'elevenlabs', 'shutterstock', 'getty'],
    maxItems: 3,
  },
  {
    name: 'The Verge Design & AI',
    rssUrl: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml',
    keywords: ['adobe', 'canva', 'firefly', 'anthropic', 'openai', 'google', 'claude', 'gpt', 'gemini', 'design'],
    maxItems: 3,
  },
  {
    name: 'VentureBeat AI',
    rssUrl: 'https://venturebeat.com/category/ai/feed/',
    keywords: ['adobe', 'canva', 'firefly', 'anthropic', 'openai', 'google deepmind', 'claude', 'gpt-', 'gemini'],
    maxItems: 3,
  },
  {
    name: 'Wired AI',
    rssUrl: 'https://www.wired.com/feed/tag/ai/latest/rss',
    keywords: ['adobe', 'canva', 'anthropic', 'openai', 'google', 'claude', 'gpt', 'gemini'],
    maxItems: 3,
  },
  {
    name: 'PR Newswire Tech',
    rssUrl: 'https://www.prnewswire.com/rss/technology-latest-news.rss',
    keywords: ['adobe', 'canva', 'shutterstock', 'getty', 'monotype', 'anthropic', 'openai', 'elevenlabs', 'suno'],
    maxItems: 3,
  },
  {
    name: 'Design Week',
    rssUrl: 'https://www.designweek.co.uk/feed/',
    keywords: ['adobe', 'canva', 'font', 'typeface', 'graphic design', 'ai design', 'monotype', 'freepik'],
    maxItems: 3,
  },
];

// ───────────────────────────────────────────
// 4순위: 국내 언론 보도자료 전체
// ───────────────────────────────────────────
const KOREAN_SOURCES = [
  // 보도자료 전문
  {
    name: '뉴스와이어',
    rssUrl: 'https://www.newswire.co.kr/rss.php?cat=all',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', '산돌캔버스', '베이키', '눈누', '윤디자인', 'adobe', 'canva', 'freepik', 'magnific', 'AI 디자인', '생성형 AI', '폰트', '이미지'],
    maxItems: 5,
  },
  // IT 전문지
  {
    name: '지디넷코리아',
    rssUrl: 'https://zdnet.co.kr/rss/all.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', '눈누', 'AI 디자인', '생성AI', 'anthropic', 'openai', '구글'],
    maxItems: 4,
  },
  {
    name: 'AI타임스',
    rssUrl: 'https://www.aitimes.com/rss/allArticle.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', '윤디자인', '눈누', 'claude', 'gpt', 'gemini', 'adobe', 'canva', 'AI 디자인'],
    maxItems: 4,
  },
  {
    name: '디지털데일리',
    rssUrl: 'https://www.ddaily.co.kr/rss/allArticle.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', '생성AI', 'AI 모델', 'AI 디자인'],
    maxItems: 4,
  },
  {
    name: '전자신문',
    rssUrl: 'https://rss.etnews.com/Section901.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', 'AI', 'anthropic', 'openai', '구글'],
    maxItems: 4,
  },
  {
    name: '아이뉴스24',
    rssUrl: 'https://www.inews24.com/rss/allArticle.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', 'AI 디자인', '생성AI', '폰트'],
    maxItems: 3,
  },
  {
    name: '연합뉴스 IT',
    rssUrl: 'https://www.yna.co.kr/rss/it.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', '눈누', 'AI', '생성형AI', '디자인'],
    maxItems: 3,
  },
  {
    name: '머니투데이 IT',
    rssUrl: 'https://rss.mt.co.kr/rss/',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', 'AI 디자인', '생성AI'],
    maxItems: 3,
  },
  {
    name: '매드타임스',
    rssUrl: 'https://www.madtimes.co.kr/rss/allArticle.xml',
    keywords: ['산돌', '산돌캔버스', '베이키', '윤디자인', 'AI 폰트', '망고보드', '미리캔버스', '어도비', '캔바', '디자인', 'freepik', 'magnific'],
    maxItems: 3,
  },
  {
    name: '디자인정글',
    rssUrl: 'https://www.jungle.co.kr/rss/allArticle.xml',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '폰트', '디자인', 'AI', '산돌', '눈누'],
    maxItems: 5,
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
        if (!seen.has(href) && links.length < 10) {
          seen.add(href);
          links.push(href);
        }
      }
    }

    if (links.length === 0) return null;

    return links.slice(0, 5).map((link) => ({
      link,
      title: link,
      description: '',
      pubDate: new Date().toISOString(),
      _scraped: true,
    }));
  } catch {
    return null;
  }
}

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
    { keywords: ['미리캔버스', 'miricanvas'], company: '미리캔버스', category: '디자인툴' },
    { keywords: ['망고보드', 'mangoboard'], company: '망고보드', category: '디자인툴' },
    { keywords: ['canva', '캔바'], company: 'Canva', category: '디자인툴' },
    { keywords: ['adobe', 'firefly', 'photoshop', 'premiere', '어도비'], company: 'Adobe', category: '디자인툴' },
    { keywords: ['freepik', 'magnific'], company: 'Freepik', category: '디자인툴' },
    { keywords: ['산돌', 'sandoll', '산돌캔버스', 'bakey', '베이키', '산돌ai', 'sandoll canvas'], company: '산돌', category: '디자인툴' },
    { keywords: ['눈누', 'noonnu'], company: '눈누', category: '폰트' },
    { keywords: ['윤디자인', 'yoondesign'], company: '윤디자인', category: '폰트' },
    { keywords: ['monotype', 'myfonts'], company: 'Monotype', category: '폰트' },
    { keywords: ['getty'], company: 'Getty Images', category: '이미지' },
    { keywords: ['shutterstock'], company: 'Shutterstock', category: '이미지' },
    { keywords: ['anthropic', 'claude'], company: 'Anthropic', category: 'AI모델' },
    { keywords: ['openai', 'chatgpt', 'gpt-'], company: 'OpenAI', category: 'AI모델' },
    { keywords: ['google', 'gemini', 'deepmind'], company: 'Google', category: 'AI모델' },
    { keywords: ['elevenlabs'], company: 'ElevenLabs', category: 'AI모델' },
    { keywords: ['suno'], company: 'Suno', category: 'AI모델' },
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
  "communityReaction": "디자이너·실무자 커뮤니티에서 나올 법한 반응 1~2문장. 반드시 현실적이고 구체적으로."
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
    communityLinks: COMMUNITY_LINKS[company] || null,
    slug,
  };
}

// ───────────────────────────────────────────
// 우선순위 소스 처리
// ───────────────────────────────────────────
async function processPrioritySource(source, existingUrls, existingSlugs, nextId, newArticles) {
  const windowMs = source.dayWindow * 24 * 60 * 60 * 1000;
  console.log(`\n⭐ [1순위] ${source.company} 수집 중...`);

  let items = null;
  for (const url of source.rssUrls) {
    items = await fetchRSS(url);
    if (items) { console.log(`  ✓ RSS: ${url}`); break; }
  }

  if (!items && source.scrapeUrls?.length > 0) {
    console.log(`  ℹ️  RSS 없음 — 페이지 스크래핑 시도`);
    for (const url of source.scrapeUrls) {
      const scraped = await scrapeArticleLinks(url);
      if (scraped && scraped.length > 0) {
        console.log(`  ✓ 스크래핑: ${url} (${scraped.length}개 링크)`);
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

  // ── 1순위: 디자인툴·폰트 회사 ──
  console.log('\n🎯 1순위 — 디자인툴·폰트 회사 (Adobe, Canva, 미리캔버스, 망고보드, 산돌, 눈누)');
  for (const source of PRIORITY_SOURCES) {
    nextId = await processPrioritySource(source, existingUrls, existingSlugs, nextId, newArticles);
  }

  // ── 2순위: AI 기업 공식 소스 ──
  console.log('\n📡 2순위 — AI 기업 공식 소스 (기사 수 제한)');
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
  }

  // ── 3순위: 글로벌 IT 미디어 ──
  console.log('\n🌐 3순위 — 글로벌 IT 미디어');
  for (const source of MEDIA_SOURCES) {
    const items = await fetchRSS(source.rssUrl);
    if (!items) { console.log(`  ⚠️  ${source.name}: RSS 없음`); continue; }

    const relevant = items.filter(item => matchesKeywords(item, source.keywords));
    console.log(`  ✓ ${source.name}: ${items.length}개 중 ${relevant.length}개 관련`);

    for (const item of relevant.slice(0, source.maxItems ?? 3)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      if (Date.now() - extractDate(item).getTime() > 3 * 24 * 60 * 60 * 1000) continue;

      const { company, category } = inferCompanyCategory(extractTitle(item), extractDescription(item));
      console.log(`  ✍️  [${company}] ${extractTitle(item).slice(0, 60)}`);
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

  // ── 4순위: 국내 언론 보도자료 ──
  console.log('\n🇰🇷 4순위 — 국내 언론 보도자료');
  for (const source of KOREAN_SOURCES) {
    const items = await fetchRSS(source.rssUrl);
    if (!items) { console.log(`  ⚠️  ${source.name}: RSS 없음`); continue; }

    const relevant = items.filter(item => matchesKeywords(item, source.keywords));
    console.log(`  ✓ ${source.name}: ${items.length}개 중 ${relevant.length}개 관련`);

    for (const item of relevant.slice(0, source.maxItems ?? 3)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      if (Date.now() - extractDate(item).getTime() > 3 * 24 * 60 * 60 * 1000) continue;

      const { company, category } = inferCompanyCategory(extractTitle(item), extractDescription(item));
      console.log(`  ✍️  [${company}] ${extractTitle(item).slice(0, 60)}`);
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
