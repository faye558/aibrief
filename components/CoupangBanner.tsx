"use client";

import { useEffect, useRef } from "react";

export default function CoupangBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || !ref.current) return;
    loaded.current = true;

    const script1 = document.createElement("script");
    script1.src = "https://ads-partners.coupang.com/g.js";
    script1.async = true;
    script1.onload = () => {
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
    document.body.appendChild(script1);
  }, []);

  return (
    <div ref={ref} className="w-[300px] h-[250px] overflow-hidden rounded-xl" />
  );
}
