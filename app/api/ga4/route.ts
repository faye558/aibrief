import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google-auth";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

export async function GET() {
  if (!PROPERTY_ID) return NextResponse.json({ error: "GA4_PROPERTY_ID 없음" }, { status: 500 });

  try {
    const token = await getAccessToken();
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const body = {
      dateRanges: [
        { startDate: thirtyDaysAgo, endDate: today, name: "30d" },
        { startDate: sevenDaysAgo, endDate: today, name: "7d" },
        { startDate: today, endDate: today, name: "today" },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      dimensions: [],
    };

    const overviewRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const overview = await overviewRes.json();

    // 상위 페이지
    const pagesRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: thirtyDaysAgo, endDate: today }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 10,
        }),
      }
    );
    const pages = await pagesRes.json();

    // 유입 채널
    const channelsRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: thirtyDaysAgo, endDate: today }],
          metrics: [{ name: "sessions" }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 8,
        }),
      }
    );
    const channels = await channelsRes.json();

    // 일별 추이 (30일)
    const dailyRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: thirtyDaysAgo, endDate: today }],
          metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
          dimensions: [{ name: "date" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
      }
    );
    const daily = await dailyRes.json();

    // 오늘 사용자별 PV (익명 ID 기준)
    const usersRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate: today, endDate: today }],
          metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "averageSessionDuration" }],
          dimensions: [{ name: "userPseudoId" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        }),
      }
    );
    const users = await usersRes.json();

    return NextResponse.json({ overview, pages, channels, daily, users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
