import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-900 text-gray-400 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-white font-bold text-lg mb-2">AI Brief</p>
            <p className="text-gray-500 text-xs leading-relaxed max-w-xs">
              AI·IT 업계의 최신 소식을 빠르고 간결하게 전달합니다.<br />
              Anthropic, OpenAI, Google, Canva, Adobe 등 주요 기업의 업데이트를 큐레이션합니다.
            </p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="text-white font-semibold mb-2">카테고리</p>
              <ul className="space-y-1">
                <li><Link href="/?category=AI모델" className="hover:text-white transition-colors">AI 모델</Link></li>
                <li><Link href="/?category=디자인툴" className="hover:text-white transition-colors">디자인 툴</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-2">정보</p>
              <ul className="space-y-1">
                <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
          © 2026 AI Brief. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
