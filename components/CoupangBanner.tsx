"use client";

import { useEffect, useRef } from "react";

export default function CoupangBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const run = () => {
      // body에 추가되기 전 자식 수 기록
      const before = document.body.children.length;

      // @ts-ignore
      new window.PartnersCoupang.G({
        id: 999030,
        template: "carousel",
        trackingCode: "AF5585556",
        width: "300",
        height: "250",
        tsource: "",
      });

      // G()가 body 끝에 붙인 요소를 컨테이너로 이동
      setTimeout(() => {
        const after = Array.from(document.body.children);
        const injected = after.slice(before).find(
          (el) => el.id?.startsWith("ads-partners") || el.tagName === "DIV"
        ) as HTMLElement | null;
        if (injected && containerRef.current) {
          containerRef.current.appendChild(injected);
        }
      }, 100);
    };

    // @ts-ignore
    if (window.PartnersCoupang) {
      run();
    } else {
      const script = document.createElement("script");
      script.src = "https://ads-partners.coupang.com/g.js";
      script.async = true;
      script.onload = run;
      document.head.appendChild(script);
    }
  }, []);

  return <div ref={containerRef} style={{ width: 300, height: 250, overflow: "hidden" }} />;
}
