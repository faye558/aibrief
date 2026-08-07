import { NextRequest, NextResponse } from "next/server";

const DRAFTS_KEY = process.env.DRAFTS_KEY ?? "aibrief-drafts";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "faye558/aibrief";
const FILE_PATH = "data/articles.json";

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-drafts-key") ?? req.nextUrl.searchParams.get("key");
  return key === DRAFTS_KEY;
}

async function getFile() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }, cache: "no-store" }
  );
  if (!res.ok) throw new Error("GitHub API error: " + res.status);
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { articles: JSON.parse(content), sha: data.sha };
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
  const result = tab === "published"
    ? articles.filter((a: { draft?: boolean; hidden?: boolean }) => !a.draft)
    : articles.filter((a: { draft?: boolean }) => a.draft);
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, action } = await req.json();
  const { articles, sha } = await getFile();
  const idx = articles.findIndex((a: { id: string }) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (action === "hide") (articles[idx] as { hidden: boolean }).hidden = true;
  else if (action === "unhide") (articles[idx] as { hidden: boolean }).hidden = false;
  else (articles[idx] as { draft: boolean }).draft = false;
  await putFile(articles, sha);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
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
  const filtered = articles.filter((a: { id: string }) => a.id !== id);
  await putFile(filtered, sha);
  return NextResponse.json({ ok: true });
}
