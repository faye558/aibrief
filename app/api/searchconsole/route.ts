import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google-auth";

const SITE = "https://aibrief.toolr.kr/";

export async function GET() {
  try {
    const token = await getAccessToken();
    const today = new Date().toISOString().split("T")[0];
    const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const base = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;

    const [summary, queries, pages, daily] = await Promise.all([
      fetch(base, { method: "POST", headers: h, body: JSON.stringify({ startDate: d30, endDate: today, rowLimit: 1 }) }).then(r => r.json()),
      fetch(base, { method: "POST", headers: h, body: JSON.stringify({ startDate: d30, endDate: today, dimensions: ["query"], rowLimit: 10, orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }] }) }).then(r => r.json()),
      fetch(base, { method: "POST", headers: h, body: JSON.stringify({ startDate: d30, endDate: today, dimensions: ["page"], rowLimit: 10, orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }] }) }).then(r => r.json()),
      fetch(base, { method: "POST", headers: h, body: JSON.stringify({ startDate: d30, endDate: today, dimensions: ["date"], rowLimit: 30, orderBy: [{ fieldName: "date", sortOrder: "ASCENDING" }] }) }).then(r => r.json()),
    ]);

    return NextResponse.json({ summary, queries, pages, daily });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
