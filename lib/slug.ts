// 제목에서 URL 슬러그 생성.
//
// 이 앱의 [slug] 동적 라우트는 한글(비ASCII) 문자가 포함된 슬러그를 요청하면
// 정적 빌드에 해당 파일이 존재해도 404를 반환하는 문제가 있다 (Next.js 16.3
// + Turbopack, 확인됨: 프로덕션 빌드에서도 재현). 그래서 한글은 로마자(개정
// 로마자 표기법 근사치)로 변환해 ASCII 슬러그를 만든다 — 원래 이 코드베이스의
// 990개 아티클이 전부 ASCII 슬러그였던 이유도 이 문제를 피하기 위해서였을 것.
const INITIALS = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MEDIALS = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const FINALS = ["", "g", "kk", "gs", "n", "nj", "nh", "d", "l", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "bs", "s", "ss", "ng", "j", "c", "k", "t", "p", "h"];

function romanizeHangul(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      const initial = Math.floor(idx / (21 * 28));
      const medial = Math.floor((idx % (21 * 28)) / 28);
      const final = idx % 28;
      out += INITIALS[initial] + MEDIALS[medial] + FINALS[final];
    } else {
      out += ch;
    }
  }
  return out;
}

export function makeSlug(title: string, existingSlugs: Set<string>, fallbackSeed?: string): string {
  const base = romanizeHangul(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/-+$/, "");

  const seed = base || (fallbackSeed ? `article-${fallbackSeed}` : "article");
  let slug = seed;
  let i = 2;
  while (existingSlugs.has(slug)) {
    slug = `${seed}-${i++}`;
  }
  return slug;
}
