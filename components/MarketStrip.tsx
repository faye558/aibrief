"use client";
import { useEffect, useState } from "react";

interface MarketItem {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number | null;
}

export default function MarketStrip({ sidebar = false }: { sidebar?: boolean }) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  const isKrw = (id: string) => id === "usd" || id === "jpy";
  const fmtValue = (item: MarketItem) => {
    if (item.value == null) return "—";
    if (isKrw(item.id)) return item.value.toLocaleString("ko-KR") + item.unit;
    return item.value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  if (sidebar) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "0.08em", color: "var(--text-faint)", textTransform: "uppercase", padding: "4px 2px 6px", fontWeight: 600 }}>시장</div>
        {loading ? (
          [1,2,3,4,5,6,7].map((i) => (
            <div key={i} style={{ height: "36px", borderRadius: "8px", background: "var(--surface)", opacity: 0.4 }} />
          ))
        ) : items.map((item) => {
          const up = item.change != null && item.change > 0;
          const down = item.change != null && item.change < 0;
          return (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "11px", color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "80px" }}>{item.label}</span>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {fmtValue(item)}
                </div>
                {item.change != null && (
                  <div style={{ fontSize: "10px", color: up ? "#3fb950" : down ? "#f85149" : "var(--text-faint)", fontVariantNumeric: "tabular-nums" }}>
                    {up ? "▲" : down ? "▼" : ""} {Math.abs(item.change).toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="market-strip-row" style={{ display: "flex", gap: "8px", overflowX: "auto", padding: "12px 16px", borderBottom: "1px solid var(--border)", scrollbarWidth: "none" }}>
      {loading ? (
        [1,2,3,4,5].map((i) => (
          <div key={i} style={{ flexShrink: 0, width: "110px", height: "60px", borderRadius: "10px", background: "var(--surface)", opacity: 0.5 }} />
        ))
      ) : items.map((item) => {
        const up = item.change != null && item.change > 0;
        const down = item.change != null && item.change < 0;
        return (
          <div key={item.id} style={{ flexShrink: 0, width: "130px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 12px" }}>
            <div style={{ fontSize: "10px", color: "var(--text-faint)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {fmtValue(item)}
              </span>
              {item.change != null && (
                <span style={{ fontSize: "10px", color: up ? "#3fb950" : down ? "#f85149" : "var(--text-faint)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {up ? "▲" : down ? "▼" : ""}{Math.abs(item.change).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
