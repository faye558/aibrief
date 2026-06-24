"use client";

import { useEffect, useRef } from "react";

export default function CoupangBanner() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const run = () => {
      // @ts-ignore
      new window.PartnersCoupang.G({
        id: 999030,
        template: "carousel",
        trackingCode: "AF5585556",
        width: "300",
        height: "250",
        tsource: "",
      });
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

  return <div style={{ width: 300, height: 250 }} />;
}
