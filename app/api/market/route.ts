import { NextResponse } from "next/server";

function prevBusinessDay(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  if (d.getDay() === 0) d.setDate(d.getDate() - 2);
  if (d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function fetchExchangeRates() {
  const prev = prevBusinessDay();
  const [usdRes, jpyRes, usdPrevRes, jpyPrevRes] = await Promise.all([
    fetch("https://api.frankfurter.app/latest?from=USD&to=KRW", { next: { revalidate: 300 } }),
    fetch("https://api.frankfurter.app/latest?from=JPY&to=KRW", { next: { revalidate: 300 } }),
    fetch(`https://api.frankfurter.app/${prev}?from=USD&to=KRW`, { next: { revalidate: 3600 } }),
    fetch(`https://api.frankfurter.app/${prev}?from=JPY&to=KRW`, { next: { revalidate: 3600 } }),
  ]);
  const [usd, jpy, usdPrev, jpyPrev] = await Promise.all([usdRes.json(), jpyRes.json(), usdPrevRes.json(), jpyPrevRes.json()]);
  const usdNow = usd.rates?.KRW as number;
  const jpyNow = jpy.rates?.KRW as number;
  const usdPrevVal = usdPrev.rates?.KRW as number;
  const jpyPrevVal = jpyPrev.rates?.KRW as number;
  return {
    usd: usdNow,
    usdChange: usdPrevVal ? ((usdNow - usdPrevVal) / usdPrevVal) * 100 : null,
    jpy: jpyNow,
    jpyChange: jpyPrevVal ? ((jpyNow - jpyPrevVal) / jpyPrevVal) * 100 : null,
  };
}

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
    const [rates, sp500, nasdaq, kodex, samsung, hynix] = await Promise.all([
      fetchExchangeRates(),
      fetchIndex("^GSPC"),
      fetchIndex("^IXIC"),
      fetchIndex("069500.KS"),
      fetchIndex("005930.KS"),
      fetchIndex("000660.KS"),
    ]);

    return NextResponse.json({
      items: [
        { id: "jpy", label: "엔화 (100엔)", value: Math.round(rates.jpy * 100), unit: "원", change: rates.jpyChange },
        { id: "usd", label: "달러", value: rates.usd, unit: "원", change: rates.usdChange },
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
