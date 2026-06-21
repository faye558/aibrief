interface Props {
  slot: "sidebar" | "content-bottom" | "in-article";
  className?: string;
}

// 애드센스 승인 후 여기에 광고 코드 삽입
// slot별 권장 사이즈:
//   sidebar       → 300×250
//   content-bottom → 728×90
//   in-article    → 336×280
export default function AdBanner({ slot: _, className: __ }: Props) {
  return null;
}
