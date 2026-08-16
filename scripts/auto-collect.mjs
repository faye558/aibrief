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

// ── 슬러그 생성 유틸 ──────────────────────────
const SLUG_COMPANY_MAP = {
  '눈누': 'noonnu', '산돌': 'sandoll', '윤디자인': 'yoondesign',
  '미리캔버스': 'miricanvas', '망고보드': 'mangoboard', 'LG CNS': 'lg-cns',
  '비비트리': 'vivitre', '유토이미지': 'utoimage',
};
const KOREAN_TO_EN = {
  '출시': 'launch', '발표': 'announce', '업데이트': 'update', '공개': 'release',
  '도입': 'intro', '확장': 'expand', '협력': 'partner', '인수': 'acquire',
  '투자': 'invest', '신규': 'new', '기능': 'feature', '서비스': 'service',
  '모델': 'model', '에이전트': 'agent', '플랫폼': 'platform', '도구': 'tool',
  '생성': 'generate', '검색': 'search', '번역': 'translate', '음성': 'voice',
  '이미지': 'image', '영상': 'video', '디자인': 'design', '폰트': 'font',
  '구독': 'subscription', '요금': 'pricing', '무료': 'free', '유료': 'paid',
  '오픈소스': 'opensource', '연구': 'research', '보안': 'security',
  '칩': 'chip', '반도체': 'chip', '데이터': 'data', '클라우드': 'cloud',
};
const SLUG_STOP_WORDS = new Set(['ai', 'the', 'and', 'for', 'with', 'from', 'to', 'of', 'in', 'a', 'an', 'is', 'llm', 'api', 'inc', 'ltd', 'co', 'corp']);
const SLUG_COMPANY_NAMES = new Set([
  'openai', 'anthropic', 'google', 'adobe', 'canva', 'freepik', 'monotype',
  'elevenlabs', 'suno', 'microsoft', 'apple', 'meta', 'amazon', 'nvidia',
  'broadcom', 'samsung', 'lg', 'kakao', 'naver', 'coupang', 'toss', 'line',
  'getty', 'shutterstock', 'midjourney', 'stability', 'runway', 'pika',
  'figma', 'notion', 'slack', 'discord',
]);

function extractSlugKeyword(title, company = '') {
  const companyLower = company.toLowerCase();
  const englishWords = title.match(/[A-Za-z][A-Za-z0-9\-\.]*(?:[0-9]+)?/g) || [];
  const meaningful = englishWords.filter(w => {
    const wl = w.toLowerCase();
    return w.length > 2 && !SLUG_STOP_WORDS.has(wl) && !SLUG_COMPANY_NAMES.has(wl) && wl !== companyLower;
  });
  if (meaningful.length >= 2) return meaningful.slice(0, 3).join('-').toLowerCase();
  if (meaningful.length === 1) {
    for (const [ko, en] of Object.entries(KOREAN_TO_EN)) {
      if (title.includes(ko)) return `${meaningful[0]}-${en}`.toLowerCase();
    }
    return meaningful[0].toLowerCase();
  }
  const koreanKeys = [];
  for (const [ko, en] of Object.entries(KOREAN_TO_EN)) {
    if (title.includes(ko)) koreanKeys.push(en);
    if (koreanKeys.length >= 2) break;
  }
  return koreanKeys.length > 0 ? koreanKeys.join('-') : 'news';
}

function makeSlug(company, title, usedSlugs) {
  const companySlug = (SLUG_COMPANY_MAP[company] || company.toLowerCase())
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const keyword = extractSlugKeyword(title, company);
  const keySlug = keyword.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const base = `${companySlug}-${keySlug}`;
  if (!usedSlugs.has(base)) { usedSlugs.add(base); return base; }
  let i = 2;
  while (usedSlugs.has(`${base}-${i}`)) i++;
  usedSlugs.add(`${base}-${i}`);
  return `${base}-${i}`;
}

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
  '비비트리':     [
    { name: '네이버 카페 검색: 비비트리', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EB%B9%84%EB%B9%84%ED%8A%B8%EB%A6%AC' },
    { name: '클리앙 검색: 비비트리', url: 'https://www.clien.net/service/search?q=%EB%B9%84%EB%B9%84%ED%8A%B8%EB%A6%AC&sort=latest' },
  ],
  '유토이미지':   [
    { name: '네이버 카페 검색: 유토이미지', url: 'https://cafe.naver.com/ArticleSearchList.nhn?search.query=%EC%9C%A0%ED%86%A0%EC%9D%B4%EB%AF%B8%EC%A7%80' },
    { name: '클리앙 검색: 유토이미지', url: 'https://www.clien.net/service/search?q=%EC%9C%A0%ED%86%A0%EC%9D%B4%EB%AF%B8%EC%A7%80&sort=latest' },
  ],
  'Perplexity':   [
    { name: 'Reddit r/perplexity_ai', url: 'https://www.reddit.com/r/perplexity_ai/new/' },
    { name: 'Reddit r/artificial', url: 'https://www.reddit.com/r/artificial/new/' },
    { name: '클리앙 검색: 퍼플렉시티', url: 'https://www.clien.net/service/search?q=%ED%8D%BC%ED%94%8C%EB%A0%89%EC%8B%9C%ED%8B%B0&sort=latest' },
  ],
  'LG CNS':       [
    { name: 'Reddit r/artificial', url: 'https://www.reddit.com/r/artificial/new/' },
    { name: '클리앙 검색: LG CNS', url: 'https://www.clien.net/service/search?q=LG+CNS&sort=latest' },
    { name: '디스크립 검색: LG CNS', url: 'https://www.disquiet.io/search?q=LG+CNS' },
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
    scrapeUrls: [
      'https://www.aitimes.com/news/articleList.html?sc_word=%EC%96%B4%EB%8F%84%EB%B9%84&view_type=sm',
      'https://zdnet.co.kr/search/?kwd=Adobe+Firefly',
    ],
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
      'https://trend.mangoboard.net/news/%EB%A7%9D%EA%B3%A0%EB%B3%B4%EB%93%9C-%EC%86%8C%EC%8B%9D',
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
      'https://www.sandoll.co.kr/rss',
      'https://sandoll.co.kr/news/rss',
      'https://rss.blog.naver.com/sandoll_canvas.xml',
      'https://rss.blog.naver.com/sandollcomm.xml',
    ],
    scrapeUrls: [
      'https://www.sandoll.co.kr/press_backup/?q=YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9',
      'https://www.sandoll.co.kr/story',
      'https://www.sandoll.co.kr/news',
      'https://blog.naver.com/sandollcomm',
      'https://canvas.sandoll.co.kr',
      'https://bakey.ai',
    ],
    maxItems: 10,
    dayWindow: 60,  // 업데이트 빈도 낮을 수 있어 넉넉하게
  },
  {
    company: '눈누',
    category: '폰트',
    rssUrls: [
      'https://noonnu.cc/rss',
    ],
    scrapeUrls: [
      'https://noonnu.cc/notice',
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
  {
    company: 'Monotype',
    category: '폰트',
    rssUrls: [
      'https://www.monotype.com/rss.xml',
      'https://www.monotype.com/news/rss',
      'https://www.monotype.com/resources/rss',
    ],
    scrapeUrls: [
      'https://www.monotype.com/resources/articles',
      'https://www.monotype.com/news',
    ],
    maxItems: 8,
    dayWindow: 30,
  },
  {
    company: '윤디자인',
    category: '폰트',
    rssUrls: [
      'https://rss.blog.naver.com/yoondesign_m.xml',
      'https://www.yoondesign-m.com/rss',
      'https://yoondesign.com/rss',
    ],
    scrapeUrls: [
      'https://www.yoondesign-m.com/news',
      'https://blog.naver.com/yoondesign_m',
    ],
    maxItems: 8,
    dayWindow: 60,
  },
];

// ───────────────────────────────────────────
// 2순위: 디자인·이미지 관련 회사 공식 소스
// (AI모델 전용 회사 제거 — 디자인 관련만 유지)
// ───────────────────────────────────────────
const COMPANY_SOURCES = [
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
    company: '비비트리',
    category: '디자인툴',
    rssUrls: [
      'https://rss.blog.naver.com/vivitre.xml',
      'https://vivitre.com/rss',
      'https://vivitre.co.kr/rss',
    ],
    scrapeUrls: [
      'https://vivitre.com/blog',
      'https://blog.naver.com/vivitre',
    ],
    maxItems: 8,
    dayWindow: 30,
  },
  {
    company: '유토이미지',
    category: '이미지',
    rssUrls: [
      'https://rss.blog.naver.com/utoimage.xml',
      'https://www.utoimage.com/rss',
    ],
    scrapeUrls: [
      'https://www.utoimage.com/news',
      'https://blog.naver.com/utoimage',
    ],
    maxItems: 5,
    dayWindow: 14,
  },
];

// ───────────────────────────────────────────
// 3순위: 글로벌 IT 미디어 + AI/테크 퍼블리케이션
// ───────────────────────────────────────────
const MEDIA_SOURCES = [
  // 디자인/UX 전문
  {
    name: 'Creative Bloq',
    rssUrl: 'https://www.creativebloq.com/feeds/all.xml',
    keywords: ['adobe', 'canva', 'freepik', 'getty', 'shutterstock', 'monotype', 'font', 'ai design', 'graphic design', 'design tool', 'ui', 'ux'],
    maxItems: 5,
  },
  {
    name: 'UX Collective',
    rssUrl: 'https://uxdesign.cc/feed',
    keywords: ['ai', 'design', 'ux', 'product', 'figma', 'interface', 'user experience'],
    maxItems: 4,
  },
  {
    name: 'Nielsen Norman Group',
    rssUrl: 'https://www.nngroup.com/feed/rss/',
    keywords: ['ai', 'ux', 'design', 'usability', 'research', 'interface'],
    maxItems: 3,
  },
  {
    name: 'Smashing Magazine',
    rssUrl: 'https://www.smashingmagazine.com/feed/',
    keywords: ['ai', 'design', 'ux', 'ui', 'figma', 'css', 'frontend', 'product'],
    maxItems: 3,
  },
  {
    name: 'Design Week',
    rssUrl: 'https://www.designweek.co.uk/feed/',
    keywords: ['adobe', 'canva', 'font', 'typeface', 'graphic design', 'ai design', 'monotype', 'freepik'],
    maxItems: 3,
  },
  // AI/테크 전문
  {
    name: 'Google AI Blog',
    rssUrl: 'https://blog.google/technology/ai/rss/',
    keywords: ['ai', 'model', 'gemini', 'design', 'product', 'research'],
    maxItems: 4,
  },
  {
    name: 'Hugging Face Blog',
    rssUrl: 'https://huggingface.co/blog/feed.xml',
    keywords: ['ai', 'model', 'llm', 'image', 'design', 'multimodal', 'agent'],
    maxItems: 3,
  },
  {
    name: 'TechCrunch AI',
    rssUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    keywords: ['ai', 'model', 'startup', 'product', 'design', 'platform', 'saas', 'agent'],
    maxItems: 4,
  },
  {
    name: 'The Verge Tech',
    rssUrl: 'https://www.theverge.com/rss/index.xml',
    keywords: ['ai', 'design', 'product', 'platform', 'app', 'tech', 'google', 'apple', 'meta', 'openai', 'anthropic'],
    maxItems: 4,
  },
  {
    name: 'Wired AI',
    rssUrl: 'https://www.wired.com/feed/tag/ai/latest/rss',
    keywords: ['ai', 'design', 'tech', 'platform', 'product', 'startup'],
    maxItems: 3,
  },
  {
    name: 'MIT Technology Review',
    rssUrl: 'https://www.technologyreview.com/feed/',
    keywords: ['ai', 'llm', 'design', 'product', 'platform', 'research', 'model'],
    maxItems: 3,
  },
  {
    name: 'GeekNews',
    rssUrl: 'https://feeds.feedburner.com/geeknews-feed',
    keywords: ['ai', '디자인', '테크', '스타트업', '플랫폼', '서비스', '개발', '인공지능'],
    maxItems: 5,
  },
  // 콘텐츠/플랫폼 소스
  {
    name: 'PR Newswire Tech',
    rssUrl: 'https://www.prnewswire.com/rss/technology-latest-news.rss',
    keywords: ['adobe', 'canva', 'shutterstock', 'getty', 'monotype', 'anthropic', 'openai', 'ai platform', 'saas', 'design'],
    maxItems: 3,
  },
];

// ───────────────────────────────────────────
// 3.5순위: 국내 기업 테크 블로그 (직접 RSS)
// ───────────────────────────────────────────
const TECH_BLOG_SOURCES = [
  // company/category 지정 → inferCompanyCategory 통과 없이 바로 수집
  { name: '토스', company: '토스', category: '테크블로그', rssUrl: 'https://toss.tech/rss.xml', maxItems: 4, dayWindow: 14 },
  { name: '우아한형제들', company: '우아한형제들', category: '테크블로그', rssUrl: 'https://techblog.woowahan.com/feed/', maxItems: 3, dayWindow: 14 },
  { name: '당근', company: '당근', category: '테크블로그', rssUrl: 'https://medium.com/feed/daangn', maxItems: 3, dayWindow: 14 },
  { name: '뱅크샐러드', company: '뱅크샐러드', category: '테크블로그', rssUrl: 'https://blog.banksalad.com/rss.xml', maxItems: 3, dayWindow: 14 },
  { name: '라인', company: '라인', category: '테크블로그', rssUrl: 'https://engineering.linecorp.com/ko/feed/', maxItems: 3, dayWindow: 14 },
  { name: '쿠팡', company: '쿠팡', category: '테크블로그', rssUrl: 'https://medium.com/feed/coupang-tech', maxItems: 3, dayWindow: 14 },
  { name: '데브시스터즈', company: '데브시스터즈', category: '테크블로그', rssUrl: 'https://tech.devsisters.com/rss.xml', maxItems: 2, dayWindow: 14 },
  { name: '무신사', company: '무신사', category: '테크블로그', rssUrl: 'https://medium.com/feed/musinsa-tech', maxItems: 2, dayWindow: 14 },
  { name: '네이버 D2', company: '네이버', category: '테크블로그', rssUrl: 'https://d2.naver.com/d2.atom', maxItems: 3, dayWindow: 14 },
  { name: '쏘카', company: '쏘카', category: '테크블로그', rssUrl: 'https://tech.socarcorp.kr/rss.xml', maxItems: 2, dayWindow: 14 },
];

// ───────────────────────────────────────────
// 4순위: 국내 언론 보도자료 전체
// ───────────────────────────────────────────
const KOREAN_SOURCES = [
  // 공통 광범위 키워드: AI, 테크, 플랫폼, 콘텐츠, IT 서비스, 스타트업
  {
    name: '뉴스와이어',
    rssUrl: 'https://www.newswire.co.kr/rss.php?cat=all',
    keywords: ['어도비', '캔바', '망고보드', '미리캔버스', '산돌', '눈누', '윤디자인', '비비트리', '유토이미지', 'adobe', 'canva', 'freepik', 'AI 디자인', '생성형 AI', '생성AI', '인공지능', '대화형 AI', 'LLM', 'AI 에이전트', '토스', '카카오', '네이버', '쿠팡', '배민', '플랫폼', '스타트업', 'SaaS', '구독', '테크', '콘텐츠'],
    maxItems: 5,
  },
  // ── 국내 기업 공식 테크블로그 (공개 배포 목적 — 저작권 리스크 없음) ──
  {
    name: '카카오 테크블로그',
    rssUrl: 'https://tech.kakao.com/feed/',
    keywords: ['AI', '인공지능', '생성AI', 'LLM', '플랫폼', '검색', 'UX', 'UI', '디자인', '서비스', '오픈소스', '에이전트'],
    maxItems: 5,
  },
  {
    name: '네이버 D2',
    rssUrl: 'https://d2.naver.com/d2.atom',
    keywords: ['AI', '인공지능', 'LLM', '생성AI', '플랫폼', 'UX', 'UI', '검색', '오픈소스', '서비스'],
    maxItems: 5,
  },
  {
    name: '토스 테크블로그',
    rssUrl: 'https://toss.tech/rss.xml',
    keywords: ['AI', '인공지능', 'UX', 'UI', '디자인', '서비스', '플랫폼', '오픈소스', '프로덕트'],
    maxItems: 5,
  },
  {
    name: '우아한형제들 기술블로그',
    rssUrl: 'https://techblog.woowahan.com/feed/',
    keywords: ['AI', '인공지능', 'LLM', 'UX', 'UI', '디자인', '서비스', '플랫폼', '오픈소스'],
    maxItems: 4,
  },
  {
    name: '당근 테크블로그',
    rssUrl: 'https://medium.com/feed/daangn',
    keywords: ['AI', '인공지능', 'UX', 'UI', '디자인', '서비스', '플랫폼', '프로덕트'],
    maxItems: 4,
  },
  {
    name: 'LINE Engineering',
    rssUrl: 'https://engineering.linecorp.com/ko/feed',
    keywords: ['AI', '인공지능', 'LLM', 'UX', 'UI', '플랫폼', '오픈소스', '서비스'],
    maxItems: 4,
  },
  // ── 국내 IT/업무환경 커뮤니티 (아웃링크 전용) ──
  {
    name: '요즘IT',
    rssUrl: 'https://yozm.wishket.com/magazine/rss/',
    keywords: ['AI', '인공지능', 'LLM', 'AI 에이전트', '업무 자동화', '생산성', '미래 직업', '일하는 방식', '테크', '프로덕트', 'SaaS', '스타트업', 'AI 시대', '업무 환경'],
    maxItems: 5,
    outlink: true,
  },
  {
    name: 'disquiet',
    rssUrl: 'https://disquiet.io/feed',
    keywords: ['AI', '인공지능', 'AI 에이전트', '업무 자동화', '생산성', '프로덕트', '스타트업', 'SaaS', '미래 직업', '일하는 방식', 'AI 시대'],
    maxItems: 4,
    outlink: true,
  },
  {
    name: 'wanted 블로그',
    rssUrl: 'https://medium.com/feed/wantedjobs',
    keywords: ['AI', '인공지능', 'AI 에이전트', '업무 자동화', '생산성', '미래 직업', '일하는 방식', '테크', '스타트업', 'AI 시대', '업무 환경', '커리어'],
    maxItems: 4,
    outlink: true,
  },
  // ── 글로벌 테크 미디어 (아웃링크 전용) ──
  {
    name: 'VentureBeat AI',
    rssUrl: 'https://venturebeat.com/category/ai/feed/',
    keywords: ['AI', 'LLM', 'agent', 'agentic', 'enterprise', 'workplace', 'productivity', 'future of work', 'Claude', 'OpenAI', 'Anthropic', 'Google', 'platform'],
    maxItems: 5,
    curation: true,
  },
  {
    name: 'Harvard Business Review AI',
    rssUrl: 'https://feeds.hbr.org/harvardbusiness',
    keywords: ['AI', 'artificial intelligence', 'future of work', 'workplace', 'productivity', 'automation', 'digital transformation', 'leadership', 'generative AI'],
    maxItems: 4,
    curation: true,
  },
  {
    name: 'Fast Company',
    rssUrl: 'https://www.fastcompany.com/technology/rss',
    keywords: ['AI', 'artificial intelligence', 'future of work', 'workplace', 'productivity', 'automation', 'generative AI', 'startup', 'tech'],
    maxItems: 4,
    curation: true,
  },
  {
    name: '매드타임스',
    rssUrl: 'https://www.madtimes.co.kr/rss/allArticle.xml',
    keywords: ['AI', '디자인', '콘텐츠', '마케팅', '플랫폼', '광고', '브랜드', '산돌', '윤디자인', '어도비', '캔바', '망고보드', '미리캔버스'],
    maxItems: 3,
    curation: true,
  },
  {
    name: '디자인정글',
    rssUrl: 'https://www.jungle.co.kr/rss/allArticle.xml',
    keywords: ['AI', '디자인', 'UX', 'UI', '어도비', '캔바', '폰트', '산돌', '눈누', '미리캔버스', '망고보드', '콘텐츠', '브랜드'],
    maxItems: 5,
    curation: true,
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
      /href="(https?:\/\/[^"]*(?:blog|news|notice|post|article|press_backup)[^"]*(?:\/\d+|idx=\d+|uid=\d+)[^"]*)"/gi,
      /href="(\/(?:blog|news|notice|post|press_backup)[^"]*(?:\/\d+|idx=\d+|uid=\d+)[^"]*)"/gi,
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
    if (!html || typeof html !== 'string') return null;

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
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractDescription(item) {
  return stripHtml(
    item._fetchedDesc ||
    item.description ||
    item.summary ||
    item['content:encoded'] ||
    item.content?.['#text'] ||
    ''
  ).slice(0, 1500);
}

// 수집 제외 키워드 — 제목/설명에 포함되면 스킵
const EXCLUDE_KEYWORDS = [
  // 피지컬 AI / 하드웨어
  '피지컬 ai', 'physical ai', '로봇', 'robot', '자율주행', '드론', '반도체', 'risc-v', '가속기',
  // ESG·CSR·채용
  'esg', '봉사활동', '사회공헌', '채용', '공개채용', '임직원',
  // 정치·정책·규제 (디자인툴 무관)
  '국가ai전략', '디지털헬스', '입법', '규제', '법안', '위원회', '부처',
  // 부동산·건설
  '아파트', '빌딩', '모듈러 홈', '시공', '건설',
  // 의료·바이오
  '헬스케어', '의료', '바이오', '병원', '임상',
  // 군사·보안
  '사이버보안', '해킹', '군사', '방산', '국방',
  // AI 벤치마크/성능 비교
  '벤치마크', 'benchmark', 'aaii', 'leaderboard', '리더보드', '성능 비교', '모델 비교',
  // 사이버보안/해킹 추가
  '취약점', '랜섬웨어', '악성코드', '블랙햇', 'black hat', 'cve', 'exploit', 'phishing',
  // 정치/사회 이슈
  '선거', '음모론', 'lgbt', '전쟁', '분쟁', '시위', '인권',
  // 하드웨어/액세서리
  '액세서리', '블랙베리', '이어폰', '헤드폰',
  // 음악 생성 AI
  'suno', 'udio', '음악 생성', 'music generation', '작곡 ai',
  // 암호화/워터마킹
  '동형 암호', 'homomorphic', '워터마킹', 'watermark', '워터마크',
];

function isExcluded(item) {
  const text = (extractTitle(item) + ' ' + extractDescription(item)).toLowerCase();
  return EXCLUDE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
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
    { keywords: ['산돌', 'sandoll', '산돌캔버스', '산돌구름', 'sandollcloud', 'bakey', '베이키', '산돌ai', 'sandoll canvas'], company: '산돌', category: '디자인툴' },
    { keywords: ['눈누', 'noonnu'], company: '눈누', category: '폰트' },
    { keywords: ['윤디자인', 'yoondesign'], company: '윤디자인', category: '폰트' },
    { keywords: ['monotype', 'myfonts'], company: 'Monotype', category: '폰트' },
    { keywords: ['getty'], company: 'Getty Images', category: '이미지' },
    { keywords: ['shutterstock'], company: 'Shutterstock', category: '이미지' },
    { keywords: ['anthropic', 'claude'], company: 'Anthropic', category: 'AI' },
    { keywords: ['openai', 'chatgpt', 'gpt-'], company: 'OpenAI', category: 'AI' },
    { keywords: ['google', 'gemini', 'deepmind'], company: 'Google', category: 'AI' },
    { keywords: ['elevenlabs'], company: 'ElevenLabs', category: 'AI' },
    { keywords: ['suno'], company: 'Suno', category: 'AI' },
    { keywords: ['비비트리', 'vivitre'], company: '비비트리', category: '디자인툴' },
    { keywords: ['유토이미지', 'utoimage'], company: '유토이미지', category: '이미지' },
    { keywords: ['perplexity', '퍼플렉시티'], company: 'Perplexity', category: 'AI' },
    { keywords: ['lg cns', 'lgcns', 'lg씨엔에스'], company: 'LG CNS', category: 'AI' },
    // 테크 기업
    { keywords: ['토스', 'toss'], company: '토스', category: '테크' },
    { keywords: ['카카오', 'kakao'], company: '카카오', category: '테크' },
    { keywords: ['네이버', 'naver'], company: '네이버', category: '테크' },
    { keywords: ['쿠팡', 'coupang'], company: '쿠팡', category: '테크' },
    { keywords: ['배민', '우아한형제들', 'woowa'], company: '우아한형제들', category: '테크' },
    { keywords: ['당근', 'daangn'], company: '당근', category: '테크' },
    { keywords: ['라인', 'line corp'], company: '라인', category: '테크' },
    // 광범위 AI/테크 — 특정 회사 미매칭 시 fallback
    { keywords: ['생성ai', '생성형 ai', '생성형ai', 'llm', '대규모 언어', 'ai 에이전트', 'agentic', '인공지능 모델', 'ai model', 'multimodal', '멀티모달'], company: 'AI·테크', category: 'AI' },
    { keywords: ['ux', 'ui/ux', 'ui ux', 'user experience', '사용자 경험', '서비스 기획', '프로덕트 디자인', 'product design'], company: 'UX·디자인', category: 'UX' },
    { keywords: ['스타트업', 'startup', 'saas', '플랫폼 서비스', '콘텐츠 플랫폼', '테크 트렌드', 'it 트렌드'], company: 'IT·테크', category: '테크' },
  ];
  for (const entry of map) {
    if (entry.keywords.some(kw => text.includes(kw))) {
      return { company: entry.company, category: entry.category };
    }
  }
  return null;
}

// ───────────────────────────────────────────
// Claude API로 한국어 기사 생성
// ───────────────────────────────────────────
function isEnglishTitle(title) {
  const englishChars = (title.match(/[A-Za-z\s]/g) || []).length;
  return englishChars / title.length > 0.5;
}

async function translateTitle(title) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: `다음 영어 제목을 자연스러운 한국어로 번역해줘. 번역문만 출력:\n${title}` }],
  });
  return msg.content[0].text.trim();
}

async function makeOutlinkArticle(company, category, item, sourceName, usedSlugs = new Set()) {
  const rawTitle = extractTitle(item);
  const link = extractLink(item);
  if (!link || !rawTitle) throw new Error('URL 또는 제목 없음');
  const pubDate = extractDate(item);
  const description = extractDescription(item);

  const title = isEnglishTitle(rawTitle) ? await translateTitle(rawTitle) : rawTitle;
  const slug = makeSlug(company, title, usedSlugs);
  return {
    slug, title,
    summary: description ? description.slice(0, 200) : title,
    content: '',
    company, category,
    date: pubDate.toISOString().slice(0, 10),
    tags: [company].filter(Boolean),
    imageUrl: null,
    sourceUrl: link,
    sourceName,
    sources: [{ url: link, name: `${sourceName} — ${rawTitle}` }],
    communityLinks: null,
    draft: false,
  };
}

async function generateCurationArticle(company, category, item, sourceName, usedSlugs = new Set()) {
  const rawTitle = extractTitle(item);
  const link = extractLink(item);
  const pubDate = extractDate(item);
  if (!link || !rawTitle) throw new Error('URL 또는 제목 없음');

  const prompt = `당신은 AI·IT 분야 큐레이터입니다. 아래 기사 제목과 링크를 보고 큐레이션 노트를 작성해주세요.

[기사 정보]
제목: ${rawTitle}
출처: ${sourceName}
URL: ${link}

[규칙]
- 기사 내용을 요약하거나 발췌하지 마세요 (저작권 이슈).
- 대신 이 뉴스가 업계/시장에서 왜 중요한지, 어떤 맥락인지를 당신의 관점으로 1~2문장 작성.
- 한국어 제목은 원문을 자연스럽게 번역.

[출력 형식 - JSON만]
{
  "title": "한국어 제목",
  "summary": "이 뉴스가 왜 중요한가 (1문장, 큐레이터 관점)",
  "content": "## 큐레이션 노트\\n이 뉴스가 업계에서 갖는 의미를 2~3문장으로. 기사 내용 발췌 금지, 맥락과 의의 중심.",
  "tags": ["태그1", "태그2"]
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const json = JSON.parse(raw);
  const dateStr = pubDate.toISOString().split('T')[0];
  const slug = makeSlug(company, json.title || rawTitle, usedSlugs);

  return {
    slug,
    title: json.title,
    summary: json.summary,
    content: json.content,
    company, category,
    date: dateStr,
    tags: json.tags || [],
    imageUrl: null,
    sourceUrl: link,
    sourceName,
    sources: [{ url: link, name: `${sourceName} — ${rawTitle}` }],
    communityLinks: null,
    draft: false,
  };
}

async function generateArticle(company, category, item, sourceName, usedSlugs = new Set()) {
  const title = extractTitle(item);
  const link = extractLink(item);
  const pubDate = extractDate(item);
  const description = extractDescription(item);

  if (!link || link.endsWith('/') || !link.includes('.')) {
    throw new Error(`실제 기사 URL 없음 — 생성 건너뜀`);
  }
  const HOMEPAGE_PATTERNS = [/^https?:\/\/[^/]+\/?$/, /\/(index|home|main|rss|feed)(\.html?)?$/i];
  if (HOMEPAGE_PATTERNS.some(p => p.test(link))) {
    throw new Error(`홈페이지 URL — 생성 건너뜀: ${link}`);
  }
  if (!description || description.trim().length < 80) {
    throw new Error(`원문 내용 부족 (${description.trim().length}자) — 생성 건너뜀`);
  }

  const prompt = `당신은 AI·IT 전문 뉴스 에디터입니다. 아래 원문 내용을 한국어로 요약·정리해주세요.

[원문 정보]
회사: ${company}
출처: ${sourceName}
원문 제목: ${title}
원문 URL: ${link}
원문 내용: ${description}

[절대 규칙]
- 원문에 없는 내용, 기능, 수치, 사실을 절대 추가하거나 창작하지 마세요.
- 원문 내용만을 바탕으로 요약하세요. 추측·상상 금지.
- 원문이 짧으면 요약도 짧게. 억지로 내용을 늘리지 마세요.

[출력 형식 - JSON만 출력]
{
  "title": "한국어 제목 — 회사명 + 핵심 내용 (원문 기반)",
  "summary": "2~3문장 한국어 요약. 원문에 있는 내용만.",
  "content": "## 주요 내용\\n- 원문 핵심 사항 (있는 것만)\\n\\n## 의미\\n원문에 근거한 의의만 1~2문장.",
  "tags": ["태그1", "태그2", "태그3"],
  "communityReaction": null
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
  const slug = makeSlug(company, json.title || title, usedSlugs);

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
    draft: false,
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

    const desc = extractDescription(item);
    if (!desc || desc.trim().length < 80) {
      if (link) {
        const fetched = await fetchArticleContent(link);
        if (fetched?.description && fetched.description.trim().length >= 80) {
          item._fetchedTitle = fetched.title;
          item._fetchedDesc = fetched.description;
        } else {
          console.log(`  skip (원문 내용 부족): ${extractTitle(item).slice(0, 60)}`);
          continue;
        }
      } else {
        console.log(`  skip (URL·내용 없음): ${extractTitle(item).slice(0, 60)}`);
        continue;
      }
    }

    console.log(`  ✍️  ${extractTitle(item).slice(0, 70)}`);
    try {
      const article = await generateArticle(source.company, source.category, item, `${source.company} 공식`, existingSlugs);
      article.id = String(nextId++);
      newArticles.push(article);
      if (link) existingUrls.add(link);
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
  const excludedUrls = (() => {
    try { return new Set(JSON.parse(readFileSync('data/excluded.json', 'utf-8'))); }
    catch { return new Set(); }
  })();
  const existingUrls = new Set(
    articles.flatMap(a => [a.sourceUrl, ...(a.sources?.map(s => s.url) || [])]).filter(Boolean)
  );
  // excluded URL도 existingUrls에 추가해서 수집 건너뜀
  excludedUrls.forEach(url => existingUrls.add(url));
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
      if (isExcluded(item)) { console.log(`  ⛔ 제외: ${extractTitle(item).slice(0, 60)}`); continue; }

      const desc2 = extractDescription(item);
      if (!desc2 || desc2.trim().length < 80) {
        if (link) {
          const fetched = await fetchArticleContent(link);
          if (fetched?.description && fetched.description.trim().length >= 80) {
            item._fetchedDesc = fetched.description;
          } else { console.log(`  skip (원문 부족): ${extractTitle(item).slice(0, 55)}`); continue; }
        } else { console.log(`  skip (내용 없음): ${extractTitle(item).slice(0, 55)}`); continue; }
      }

      console.log(`  ✍️  [${source.company}] ${extractTitle(item).slice(0, 60)}`);
      try {
        const article = await generateArticle(source.company, source.category, item, `${source.company} 공식`, existingSlugs);
        article.id = String(nextId++);
        newArticles.push(article);
        if (link) existingUrls.add(link);
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
      if (isExcluded(item)) { console.log(`  ⛔ 제외: ${extractTitle(item).slice(0, 60)}`); continue; }

      const inferred = inferCompanyCategory(extractTitle(item), extractDescription(item));
      if (!inferred) { console.log(`  skip (디자인 무관): ${extractTitle(item).slice(0, 60)}`); continue; }
      const { company, category } = inferred;
      const mode = source.outlink ? '🔗' : source.curation ? '📌' : '✍️ ';
      console.log(`  ${mode} [${company}] ${extractTitle(item).slice(0, 60)}`);
      try {
        const article = source.outlink
          ? await makeOutlinkArticle(company, category, item, source.name, existingSlugs)
          : source.curation
            ? await generateCurationArticle(company, category, item, source.name, existingSlugs)
            : await generateArticle(company, category, item, source.name, existingSlugs);
        article.id = String(nextId++);
        newArticles.push(article);
        if (link) existingUrls.add(link);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { console.error(`    ❌ ${e.message}`); }
    }
  }

  // ── 3.5순위: 국내 기업 테크 블로그 ──
  console.log('\n🏢 3.5순위 — 국내 기업 테크 블로그');
  for (const source of TECH_BLOG_SOURCES) {
    const items = await fetchRSS(source.rssUrl);
    if (!items) { console.log(`  ⚠️  ${source.name}: RSS 없음`); continue; }

    const cutoff = Date.now() - (source.dayWindow ?? 14) * 24 * 60 * 60 * 1000;
    const recent = items.filter(item => extractDate(item).getTime() > cutoff);
    console.log(`  ✓ ${source.name}: ${items.length}개 중 최근 ${recent.length}개`);

    for (const item of recent.slice(0, source.maxItems ?? 3)) {
      const link = extractLink(item);
      if (link && existingUrls.has(link)) continue;
      if (isExcluded(item)) { console.log(`  ⛔ 제외: ${extractTitle(item).slice(0, 60)}`); continue; }

      console.log(`  ✍️  [${source.company}] ${extractTitle(item).slice(0, 60)}`);
      try {
        const article = await generateArticle(source.company, source.category, item, source.name, existingSlugs);
        article.id = String(nextId++);
        newArticles.push(article);
        if (link) existingUrls.add(link);
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
      if (isExcluded(item)) { console.log(`  ⛔ 제외: ${extractTitle(item).slice(0, 60)}`); continue; }

      const inferred2 = inferCompanyCategory(extractTitle(item), extractDescription(item));
      if (!inferred2) { console.log(`  skip (디자인 무관): ${extractTitle(item).slice(0, 60)}`); continue; }
      const { company, category } = inferred2;
      const mode2 = source.outlink ? '🔗' : source.curation ? '📌' : '✍️ ';
      console.log(`  ${mode2} [${company}] ${extractTitle(item).slice(0, 60)}`);
      try {
        const article = source.outlink
          ? await makeOutlinkArticle(company, category, item, source.name, existingSlugs)
          : source.curation
            ? await generateCurationArticle(company, category, item, source.name, existingSlugs)
            : await generateArticle(company, category, item, source.name, existingSlugs);
        article.id = String(nextId++);
        newArticles.push(article);
        if (link) existingUrls.add(link);
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
