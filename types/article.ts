export interface ArticleSource {
  url: string;
  name: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  company: string;
  category: string;
  date: string;
  tags: string[];
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  sources?: ArticleSource[];
  communityReaction?: string;
}

export const COMPANIES = ["전체", "Anthropic", "OpenAI", "Google", "Canva", "Adobe", "Freepik", "미리캔버스", "망고보드", "Getty Images", "Shutterstock", "Adobe Stock", "ElevenLabs", "Suno", "Meshy·Tripo3D", "산돌", "윤디자인", "눈누", "Monotype"] as const;
export const CATEGORIES = ["전체", "AI모델", "디자인툴", "3D AI", "이미지", "폰트"] as const;

export type Company = (typeof COMPANIES)[number];
export type Category = (typeof CATEGORIES)[number];
