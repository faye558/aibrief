import { NextResponse } from "next/server";

async function fetchIndex(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 },
  });
  const data = await res.json();
  const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const filtered = closes.filter((v) => v != null);
  const current = filtered[filtered.length - 1];
  const prev = filtered[filtered.length - 2];
  const change = prev ? ((current - prev) / prev) * 100 : 0;
  return { value: current, change };
}

export async function GET() {
  try {
    const [usd, jpy, sp500, nasdaq, kodex, samsung, hynix] = await Promise.all([
      fetchIndex("KRW=X"),
      fetchIndex("JPYKRW=X"),
      fetchIndex("^GSPC"),
      fetchIndex("^IXIC"),
      fetchIndex("069500.KS"),
      fetchIndex("005930.KS"),
      fetchIndex("000660.KS"),
    ]);

    return NextResponse.json({
      items: [
        { id: "jpy", label: "엔화 (100엔)", value: Math.round(jpy.value * 100), unit: "원", change: jpy.change },
        { id: "usd", label: "달러", value: usd.value, unit: "원", change: usd.change },
        { id: "kodex200", label: "KODEX200", value: kodex.value, unit: "", change: kodex.change },
        { id: "samsung", label: "삼성전자", value: samsung.value, unit: "", change: samsung.change },
        { id: "hynix", label: "SK하이닉스", value: hynix.value, unit: "", change: hynix.change },
        { id: "sp500", label: "S&P 500", value: sp500.value, unit: "", change: sp500.change },
        { id: "nasdaq", label: "나스닥", value: nasdaq.value, unit: "", change: nasdaq.change },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
