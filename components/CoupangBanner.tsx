"use client";

import { useEffect, useRef } from "react";

let idCounter = 0;

export default function CoupangBanner() {
  const containerId = useRef(`coupang-${++idCounter}`);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const load = () => {
      // @ts-ignore
      new window.PartnersCoupang.G({
        id: 999030,
        template: "carousel",
        trackingCode: "AF5585556",
        width: "300",
        height: "250",
        tsource: "",
        container: containerId.current,
      });
    };

    // @ts-ignore
    if (window.PartnersCoupang) {
      load();
    } else {
      const script = document.createElement("script");
      script.src = "https://ads-partners.coupang.com/g.js";
      script.async = true;
      script.onload = load;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div
      id={containerId.current}
      style={{ width: 300, height: 250, overflow: "hidden" }}
    />
  );
}
