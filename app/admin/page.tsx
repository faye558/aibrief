"use client";

import { useEffect, useState } from "react";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 truncate max-w-[70%]">{label}</span>
        <span className="text-gray-500 font-medium ml-2">{value.toLocaleString()}{sub}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div className="h-1.5 bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SparkLine({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 48;
  const w = 300;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

export default function AdminPage() {
  const [ga, setGa] = useState<any>(null);
  const [sc, setSc] = useState<any>(null);
  const [gaErr, setGaErr] = useState<string | null>(null);
  const [scErr, setScErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/ga4").then(r => r.json()).then(setGa).catch(e => setGaErr(e.message)),
      fetch("/api/searchconsole").then(r => r.json()).then(setSc).catch(e => setScErr(e.message)),
    ]).finally(() => setLoading(false));
  }, []);

  // GA4 파싱
  const parseMetric = (data: any, rangeIdx: number, metricIdx: number) => {
    try { return parseFloat(data.rows?.[rangeIdx]?.metricValues?.[metricIdx]?.value || "0"); }
    catch { return 0; }
  };

  const ga30Users = ga && !ga.error ? parseMetric(ga.overview, 0, 0) : null;
  const ga7Users = ga && !ga.error ? parseMetric(ga.overview, 1, 0) : null;
  const gaTodayUsers = ga && !ga.error ? parseMetric(ga.overview, 2, 0) : null;
  const ga30Views = ga && !ga.error ? parseMetric(ga.overview, 0, 1) : null;
  const gaAvgDuration = ga && !ga.error ? parseMetric(ga.overview, 0, 4) : null;

  const gaPages = ga?.pages?.rows || [];
  const gaChannels = ga?.channels?.rows || [];
  const gaDaily = ga?.daily?.rows || [];
  const gaDailyUsers = gaDaily.map((r: any) => parseFloat(r.metricValues?.[0]?.value || "0"));
  const gaDailyViews = gaDaily.map((r: any) => parseFloat(r.metricValues?.[1]?.value || "0"));

  // SC 파싱
  const scTotals = sc?.summary?.rows?.[0] || null;
  const scQueries = sc?.queries?.rows || [];
  const scPages = sc?.pages?.rows || [];
  const scDaily = sc?.daily?.rows || [];
  const scDailyClicks = scDaily.map((r: any) => r.clicks || 0);
  const scDailyImpressions = scDaily.map((r: any) => r.impressions || 0);

  const fmt = (n: number | null) => n === null ? "-" : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toLocaleString();
  const fmtDur = (s: number | null) => s === null ? "-" : `${Math.floor(s / 60)}분 ${Math.round(s % 60)}초`;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">최근 30일 기준 · GA4 + Search Console</p>
        </div>
        {loading && <span className="text-sm text-gray-400 animate-pulse">데이터 로딩 중…</span>}
      </div>

      {/* ── GA4 섹션 ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Google Analytics 4 — 트래픽</h2>
        </div>

        {gaErr || ga?.error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ⚠️ GA4 연결 실패: {gaErr || ga?.error} — 아래 설정 가이드를 확인해 주세요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="오늘 방문자" value={fmt(gaTodayUsers)} />
              <StatCard label="7일 방문자" value={fmt(ga7Users)} />
              <StatCard label="30일 방문자" value={fmt(ga30Users)} />
              <StatCard label="30일 페이지뷰" value={fmt(ga30Views)} sub={`평균 체류 ${fmtDur(gaAvgDuration)}`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">일별 방문자 (30일)</p>
                <SparkLine data={gaDailyUsers} color="#2563eb" />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">일별 페이지뷰 (30일)</p>
                <SparkLine data={gaDailyViews} color="#7c3aed" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">상위 페이지 (30일)</p>
                {gaPages.slice(0, 8).map((r: any, i: number) => (
                  <MiniBar
                    key={i}
                    label={r.dimensionValues?.[1]?.value || r.dimensionValues?.[0]?.value || "-"}
                    value={parseInt(r.metricValues?.[0]?.value || "0")}
                    max={parseInt(gaPages[0]?.metricValues?.[0]?.value || "1")}
                    sub=" 뷰"
                  />
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">유입 채널 (30일)</p>
                {gaChannels.map((r: any, i: number) => (
                  <MiniBar
                    key={i}
                    label={r.dimensionValues?.[0]?.value || "-"}
                    value={parseInt(r.metricValues?.[0]?.value || "0")}
                    max={parseInt(gaChannels[0]?.metricValues?.[0]?.value || "1")}
                    sub=" 세션"
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Search Console 섹션 ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Google Search Console — 검색 현황</h2>
        </div>

        {scErr || sc?.error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ⚠️ Search Console 연결 실패: {scErr || sc?.error} — 아래 설정 가이드를 확인해 주세요.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="총 클릭 (30일)" value={fmt(scTotals?.clicks ?? null)} />
              <StatCard label="총 노출 (30일)" value={fmt(scTotals?.impressions ?? null)} />
              <StatCard label="평균 CTR" value={scTotals ? fmtPct(scTotals.ctr) : "-"} />
              <StatCard label="평균 순위" value={scTotals ? `${scTotals.position.toFixed(1)}위` : "-"} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">일별 클릭 (30일)</p>
                <SparkLine data={scDailyClicks} color="#16a34a" />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">일별 노출 (30일)</p>
                <SparkLine data={scDailyImpressions} color="#ca8a04" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">상위 검색어 (30일)</p>
                {scQueries.length === 0 && <p className="text-sm text-gray-400">데이터 없음 (색인 대기 중)</p>}
                {scQueries.slice(0, 8).map((r: any, i: number) => (
                  <MiniBar
                    key={i}
                    label={r.keys?.[0] || "-"}
                    value={r.clicks}
                    max={scQueries[0]?.clicks || 1}
                    sub=" 클릭"
                  />
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-gray-500 mb-3">상위 페이지 (30일)</p>
                {scPages.length === 0 && <p className="text-sm text-gray-400">데이터 없음 (색인 대기 중)</p>}
                {scPages.slice(0, 8).map((r: any, i: number) => (
                  <MiniBar
                    key={i}
                    label={(r.keys?.[0] || "-").replace("https://aibrief.toolr.kr", "")}
                    value={r.clicks}
                    max={scPages[0]?.clicks || 1}
                    sub=" 클릭"
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── 설정 가이드 ── */}
      <section className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">⚙️ 연결 설정 가이드</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li><a href="https://console.cloud.google.com/" target="_blank" className="text-brand-600 underline">Google Cloud Console</a> → 서비스 계정 생성 → JSON 키 다운로드</li>
          <li>GA4 관리 → 속성 액세스 관리 → 서비스 계정 이메일 추가 (뷰어)</li>
          <li>Search Console → 설정 → 사용자 및 권한 → 서비스 계정 이메일 추가 (제한됨)</li>
          <li>Vercel 환경변수에 추가:
            <ul className="ml-5 mt-1 space-y-1 list-disc">
              <li><code className="bg-gray-200 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_KEY</code> — JSON 키 파일 전체 내용</li>
              <li><code className="bg-gray-200 px-1 rounded">GA4_PROPERTY_ID</code> — GA4 속성 ID (숫자, 예: 123456789)</li>
            </ul>
          </li>
        </ol>
      </section>
    </div>
  );
}
