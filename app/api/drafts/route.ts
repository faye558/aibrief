import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

const DRAFTS_KEY = process.env.DRAFTS_KEY ?? "aibrief-drafts";
const filePath = join(process.cwd(), "data", "articles.json");

function readArticles() {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function writeArticles(articles: unknown[]) {
  writeFileSync(filePath, JSON.stringify(articles, null, 2));
}

function checkAuth(req: NextRequest) {
  const key = req.headers.get("x-drafts-key") ?? req.nextUrl.searchParams.get("key");
  return key === DRAFTS_KEY;
}

// GET /api/drafts — draft 목록
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const all = readArticles();
  const drafts = all.filter((a: { draft?: boolean }) => a.draft);
  return NextResponse.json(drafts);
}

// PATCH /api/drafts — 승인 (draft: false)
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const all = readArticles();
  const idx = all.findIndex((a: { id: string }) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  all[idx].draft = false;
  writeArticles(all);
  return NextResponse.json({ ok: true });
}

// DELETE /api/drafts — 삭제
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const all = readArticles();
  const filtered = all.filter((a: { id: string }) => a.id !== id);
  writeArticles(filtered);
  return NextResponse.json({ ok: true });
}
