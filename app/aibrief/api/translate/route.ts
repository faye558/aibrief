import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: `다음 제목을 자연스러운 한국어로 번역해줘. 번역문만 출력:\n${title}` }],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "api error" }, { status: 500 });
  const data = await res.json();
  return NextResponse.json({ translated: data.content[0].text.trim() });
}
