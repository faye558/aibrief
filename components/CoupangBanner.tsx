"use client";

import { useEffect, useId, useRef } from "react";

export default function CoupangBanner() {
  const id = useId().replace(/:/g, "-");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const run = () => {
      const el = document.getElementById(id);
      if (!el) return;
      // @ts-ignore
      new window.PartnersCoupang.G({
        id: 999030,
        template: "carousel",
        trackingCode: "AF5585556",
        width: "300",
        height: "250",
        tsource: "",
      });
      // 쿠팡이 body 끝에 렌더링하면 el 안으로 이동
      const injected = document.querySelector("div[id^='ads-partners']") as HTMLElement | null;
      if (injected) el.appendChild(injected);
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

  return <div id={id} style={{ width: 300, height: 250, overflow: "hidden" }} />;
}
