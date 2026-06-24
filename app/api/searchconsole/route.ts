import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google-auth";

const SITE_URL = "https://aibrief.toolr.kr/";

export async function GET() {
  try {
    const token = await getAccessToken();
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const base = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

    // 전체 요약
    const summaryRes = await fetch(base, {
      method: "POST", headers,
      body: JSON.stringify({ startDate: thirtyDaysAgo, endDate: today, rowLimit: 1 }),
    });
    const summary = await summaryRes.json();

    // 상위 검색어
    const queriesRes = await fetch(base, {
      method: "POST", headers,
      body: JSON.stringify({
        startDate: thirtyDaysAgo, endDate: today,
        dimensions: ["query"],
        rowLimit: 10,
        orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      }),
    });
    const queries = await queriesRes.json();

    // 상위 페이지
    const pagesRes = await fetch(base, {
      method: "POST", headers,
      body: JSON.stringify({
        startDate: thirtyDaysAgo, endDate: today,
        dimensions: ["page"],
        rowLimit: 10,
        orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      }),
    });
    const pages = await pagesRes.json();

    // 일별 추이
    const dailyRes = await fetch(base, {
      method: "POST", headers,
      body: JSON.stringify({
        startDate: thirtyDaysAgo, endDate: today,
        dimensions: ["date"],
        rowLimit: 30,
        orderBy: [{ fieldName: "date", sortOrder: "ASCENDING" }],
      }),
    });
    const daily = await dailyRes.json();

    return NextResponse.json({ summary, queries, pages, daily });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
