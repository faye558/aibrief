import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function toSlugBase(company, keyword) {
  const companySlug = company
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const COMPANY_MAP = {
    'anthropic': 'anthropic', 'openai': 'openai', 'google': 'google',
    'adobe': 'adobe', 'canva': 'canva', 'freepik': 'freepik',
    'monotype': 'monotype', 'elevenlabs': 'elevenlabs', 'suno': 'suno',
    '미리캔버스': 'miricanvas', '망고보드': 'mangoboard', '산돌': 'sandoll',
    '눈누': 'noonnu', '윤디자인': 'yoondesign', '비비트리': 'vivitre',
    '유토이미지': 'utoimage', '토스': 'toss', '카카오': 'kakao',
    '네이버': 'naver', '쿠팡': 'coupang', '우아한형제들': 'woowahan',
    '당근': 'daangn', '라인': 'line', 'getty images': 'getty',
    'shutterstock': 'shutterstock', 'lg cns': 'lg-cns',
    'ai·it': 'ai', 'ai·테크': 'ai', 'ux·디자인': 'ux',
    'it·테크': 'tech',
  };

  const fallback = companySlug.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'article';
  const mapped = COMPANY_MAP[company.toLowerCase()] !== undefined ? COMPANY_MAP[company.toLowerCase()] : fallback;

  const keySlug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  return `${mapped}-${keySlug}`;
}

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

const COMPANY_NAMES = new Set([
  'openai', 'anthropic', 'google', 'adobe', 'canva', 'freepik', 'monotype',
  'elevenlabs', 'suno', 'microsoft', 'apple', 'meta', 'amazon', 'nvidia',
  'broadcom', 'samsung', 'lg', 'kakao', 'naver', 'coupang', 'toss', 'line',
  'getty', 'shutterstock', 'midjourney', 'stability', 'runway', 'pika',
  'figma', 'notion', 'slack', 'discord', 'linkedin', 'twitter', 'instagram',
]);

function extractKeyword(title, company = '') {
  const companyLower = company.toLowerCase();
  // 영어 단어/숫자 추출 (GPT-4, Firefly 4, LLM 등)
  const englishWords = title.match(/[A-Za-z][A-Za-z0-9\-\.]*(?:[0-9]+)?/g) || [];
  const stopWords = new Set(['ai', 'the', 'and', 'for', 'with', 'from', 'to', 'of', 'in', 'a', 'an', 'is', 'llm', 'api', 'inc', 'ltd', 'co', 'corp']);
  const meaningful = englishWords.filter(w => {
    const wl = w.toLowerCase();
    return w.length > 2 && !stopWords.has(wl) && !COMPANY_NAMES.has(wl) && wl !== companyLower;
  });

  if (meaningful.length >= 2) {
    return meaningful.slice(0, 3).join('-').toLowerCase();
  }
  if (meaningful.length === 1) {
    // 한국어 키워드 보완
    for (const [ko, en] of Object.entries(KOREAN_TO_EN)) {
      if (title.includes(ko)) return `${meaningful[0]}-${en}`.toLowerCase();
    }
    return meaningful[0].toLowerCase();
  }

  // 영어 없으면 한국어에서 매핑
  const koreanKeys = [];
  for (const [ko, en] of Object.entries(KOREAN_TO_EN)) {
    if (title.includes(ko)) koreanKeys.push(en);
    if (koreanKeys.length >= 2) break;
  }
  return koreanKeys.length > 0 ? koreanKeys.join('-') : 'news';
}

async function generateKeywords(batch) {
  return batch.map(a => extractKeyword(a.title, a.company));
}

async function main() {
  const articles = JSON.parse(readFileSync('data/articles.json', 'utf-8'));
  const usedSlugs = new Map(); // base -> count

  function uniqueSlug(base) {
    const count = usedSlugs.has(base) ? usedSlugs.get(base) : 0;
    usedSlugs.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  const BATCH_SIZE = 20;
  const slugMap = new Map(); // old slug -> new slug
  let processed = 0;

  console.log(`총 ${articles.length}개 기사 슬러그 변환 시작...`);

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    console.log(`처리 중: ${i + 1}~${Math.min(i + BATCH_SIZE, articles.length)}번째...`);

    try {
      const keywords = await generateKeywords(batch);
      batch.forEach((a, idx) => {
        const base = toSlugBase(a.company, keywords[idx] ?? 'article');
        const newSlug = uniqueSlug(base);
        slugMap.set(a.slug, newSlug);
      });
    } catch (e) {
      console.error(`배치 ${i} 실패:`, e.message);
      batch.forEach((a) => {
        const base = toSlugBase(a.company, 'article');
        slugMap.set(a.slug, uniqueSlug(base));
      });
    }

    processed += batch.length;
    await new Promise(r => setTimeout(r, 500));
  }

  // 슬러그 업데이트
  const updated = articles.map(a => ({
    ...a,
    slug: slugMap.get(a.slug) ?? a.slug,
  }));

  writeFileSync('data/articles.json', JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`\n✅ 완료: ${processed}개 슬러그 변환`);
  console.log('\n변환 예시 (처음 10개):');
  let count = 0;
  for (const [oldSlug, newSlug] of slugMap) {
    if (count++ >= 10) break;
    console.log(`  ${oldSlug} → ${newSlug}`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
