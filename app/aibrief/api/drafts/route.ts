import { NextRequest, NextResponse } from "next/server";

const DRAFTS_KEY = process.env.DRAFTS_KEY ?? "aibrief-drafts";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "faye558/aibrief";
const FILE_PATH = "data/articles.json";
const EXCLUDED_PATH = "data/excluded.json";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-drafts-key") ?? req.nextUrl.searchParams.get("key");
  return key === DRAFTS_KEY;
}

async function getFile() {
  // Contents API has a 1MB limit — use Git Blobs API for large files
  const metaRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }, cache: "no-store" }
  );
  if (!metaRes.ok) throw new Error("GitHub API error: " + metaRes.status);
  const meta = await metaRes.json();
  const sha = meta.sha;

  // Fetch actual content via Blobs API (no size limit)
  const blobRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/git/blobs/${sha}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3.raw" }, cache: "no-store" }
  );
  if (!blobRes.ok) throw new Error("GitHub Blob error: " + blobRes.status);
  const content = await blobRes.text();
  return { articles: JSON.parse(content), sha: meta.sha };
}

async function putFile(articles: unknown[], sha: string) {
  const content = Buffer.from(JSON.stringify(articles, null, 2)).toString("base64");
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
      body: JSON.stringify({ message: "drafts: update articles", content, sha }),
    }
  );
  if (!res.ok) throw new Error("GitHub PUT error: " + res.status);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const tab = req.nextUrl.searchParams.get("tab") ?? "drafts";
  const { articles } = await getFile();
  const result = (tab === "published"
    ? articles.filter((a: { draft?: boolean; hidden?: boolean }) => !a.draft)
    : articles.filter((a: { draft?: boolean }) => a.draft))
    .sort((a: { date?: string }, b: { date?: string }) => (b.date ?? "").localeCompare(a.date ?? ""));
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, action } = body;
  const { articles, sha } = await getFile();
  const idx = articles.findIndex((a: { id: string }) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (action === "hide") (articles[idx] as { hidden: boolean }).hidden = true;
  else if (action === "unhide") (articles[idx] as { hidden: boolean }).hidden = false;
  else if (action === "edit") {
    const { title, summary, content, category, tags, sourceName, sourceUrl } = body;
    Object.assign(articles[idx], { title, summary, content, category, tags, sourceName, sourceUrl: sourceUrl || null });
  }
  else (articles[idx] as { draft: boolean }).draft = false;
  await putFile(articles, sha);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();

  // AI 초안 생성
  if (body.action === "generate") {
    const topic = body.topic;
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "no api key" }, { status: 500 });
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: `다음 주제로 aibrief 사이트에 올릴 한국어 아티클 초안을 작성해줘.\n\n주제: ${topic}\n\n아래 JSON 형식으로만 응답해줘 (마크다운 코드블록 없이 순수 JSON):\n{\n  "title": "제목 (50자 이내)",\n  "summary": "한 줄 요약 (100자 이내)",\n  "content": "본문 (마크다운 형식, 500~800자, 소제목 포함)",\n  "category": "IT·테크 | AI·머신러닝 | 디자인·UX | 업무환경·생산성 | 스타트업·비즈니스 중 하나",\n  "tags": ["태그1", "태그2", "태그3"],\n  "sourceName": "직접 작성"\n}` }],
      }),
    });
    if (!aiRes.ok) {
      const err = await aiRes.text();
      return NextResponse.json({ error: `anthropic ${aiRes.status}`, detail: err }, { status: 500 });
    }
    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text?.trim() ?? "";
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ error: "parse failed", raw: text }, { status: 500 });
    }
  }
  const { articles, sha } = await getFile();
  const id = Date.now().toString();
  const slug = id;
  const newArticle = {
    id,
    slug,
    title: body.title ?? "",
    summary: body.summary ?? "",
    content: body.content ?? "",
    category: body.category ?? "IT·테크",
    tags: body.tags ?? [],
    company: body.company ?? "",
    sourceName: body.sourceName ?? "",
    sourceUrl: body.sourceUrl ?? null,
    imageUrl: null,
    date: new Date().toISOString().slice(0, 10),
    draft: true,
  };
  articles.unshift(newArticle);
  await putFile(articles, sha);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const { articles, sha } = await getFile();
  const target = articles.find((a: { id: string }) => a.id === id) as { id: string; sourceUrl?: string } | undefined;
  const filtered = articles.filter((a: { id: string }) => a.id !== id);
  await putFile(filtered, sha);

  // sourceUrl을 excluded.json에 추가
  if (target?.sourceUrl) {
    try {
      const excRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${EXCLUDED_PATH}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }, cache: "no-store" }
      );
      if (excRes.ok) {
        const excData = await excRes.json();
        const excList: string[] = JSON.parse(Buffer.from(excData.content, "base64").toString("utf-8"));
        if (!excList.includes(target.sourceUrl)) {
          excList.push(target.sourceUrl);
          const excContent = Buffer.from(JSON.stringify(excList, null, 2)).toString("base64");
          await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${EXCLUDED_PATH}`, {
            method: "PUT",
            headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
            body: JSON.stringify({ message: "excluded: 삭제된 기사 URL 추가", content: excContent, sha: excData.sha }),
          });
        }
      }
    } catch { /* excluded 업데이트 실패해도 삭제는 성공 */ }
  }

  return NextResponse.json({ ok: true });
}
