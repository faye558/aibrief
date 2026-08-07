import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DRAFTS_KEY = process.env.DRAFTS_KEY ?? "aibrief-drafts";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-drafts-key") ?? req.nextUrl.searchParams.get("key");
  return key === DRAFTS_KEY;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { topic } = await req.json();
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `다음 주제로 aibrief 사이트에 올릴 한국어 아티클 초안을 작성해줘.

주제: ${topic}

아래 JSON 형식으로만 응답해줘 (마크다운 코드블록 없이 순수 JSON):
{
  "title": "제목 (50자 이내)",
  "summary": "한 줄 요약 (100자 이내)",
  "content": "본문 (마크다운 형식, 500~800자, 소제목 포함)",
  "category": "IT·테크 | AI·머신러닝 | 디자인·UX | 업무환경·생산성 | 스타트업·비즈니스 중 하나",
  "tags": ["태그1", "태그2", "태그3"],
  "sourceName": "직접 작성"
}

톤: 전문적이지만 읽기 쉬운 한국어. 직접 경험/관찰을 바탕으로 한 인사이트 중심.`,
    }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text.trim();
  try {
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "parse failed", raw: text }, { status: 500 });
  }
}
