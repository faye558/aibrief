interface Props {
  slot: "sidebar" | "content-bottom" | "in-article";
  className?: string;
}

const SLOT_CONFIG = {
  sidebar: { label: "사이드바 광고 (Google AdSense — 300×250)", height: "h-[250px]", width: "w-[300px]" },
  "content-bottom": { label: "본문 하단 광고 (Google AdSense — 728×90)", height: "h-[90px]", width: "w-full max-w-2xl" },
  "in-article": { label: "본문 내 광고 (Google AdSense — 336×280)", height: "h-[280px]", width: "w-full max-w-sm" },
};

export default function AdBanner({ slot, className = "" }: Props) {
  const config = SLOT_CONFIG[slot];

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className={`${config.height} ${config.width} bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center`}
      >
        <p className="text-xs text-gray-400 text-center px-4">{config.label}</p>
      </div>
    </div>
  );
}
