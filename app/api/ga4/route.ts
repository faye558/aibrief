import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google-auth";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

export async function GET() {
  if (!PROPERTY_ID) return NextResponse.json({ error: "GA4_PROPERTY_ID 없음" }, { status: 500 });
  try {
    const token = await getAccessToken();
    const today = new Date().toISOString().split("T")[0];
    const d30 = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const d7 = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`;

    const [overview, pages, channels, daily] = await Promise.all([
      fetch(url, { method: "POST", headers: h, body: JSON.stringify({
        dateRanges: [{ startDate: d30, endDate: today, name: "30d" }, { startDate: d7, endDate: today, name: "7d" }, { startDate: today, endDate: today, name: "today" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }, { name: "sessions" }, { name: "averageSessionDuration" }],
        dimensions: [],
      }) }).then(r => r.json()),
      fetch(url, { method: "POST", headers: h, body: JSON.stringify({
        dateRanges: [{ startDate: d30, endDate: today }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }) }).then(r => r.json()),
      fetch(url, { method: "POST", headers: h, body: JSON.stringify({
        dateRanges: [{ startDate: d30, endDate: today }],
        metrics: [{ name: "sessions" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 8,
      }) }).then(r => r.json()),
      fetch(url, { method: "POST", headers: h, body: JSON.stringify({
        dateRanges: [{ startDate: d30, endDate: today }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }) }).then(r => r.json()),
    ]);

    return NextResponse.json({ overview, pages, channels, daily });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
