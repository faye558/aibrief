import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AI Brief — AI·IT 뉴스 브리핑";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, color: "white", letterSpacing: "-2px" }}>
          AI Brief
        </div>
        <div style={{ fontSize: 36, color: "#93c5fd", marginTop: 16 }}>
          AI·IT 뉴스 브리핑
        </div>
        <div style={{ fontSize: 24, color: "#bfdbfe", marginTop: 12 }}>
          aibrief.toolr.kr
        </div>
      </div>
    ),
    size
  );
}
