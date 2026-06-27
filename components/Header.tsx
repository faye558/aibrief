"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
    <nav className="bg-[#0d1117] text-[#aaa] text-[13px] flex items-center px-6">
      <a href="https://aibrief.toolr.kr" className="py-2.5 px-4 text-white font-semibold hover:text-white transition-colors">AI Brief</a>
      <span className="text-[#333]">·</span>
      <a href="https://travel.toolr.kr" className="py-2.5 px-4 hover:text-white transition-colors">여행 패키지</a>
    </nav>
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      {/* 애드센스 승인 후 헤더 상단 배너 삽입 — 728×90 */}

<div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-[1.65rem] sm:text-3xl font-extrabold tracking-[-0.03em] bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent leading-none">
              AI Brief
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-brand-600 transition-colors">홈</Link>
            <Link href="/?category=AI모델" className="hover:text-brand-600 transition-colors">AI 모델</Link>
            <Link href="/?category=디자인툴" className="hover:text-brand-600 transition-colors">디자인 툴</Link>
            <Link href="/timeline" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              타임라인
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-gray-500"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden py-3 border-t border-gray-100 flex flex-col gap-3 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-brand-600" onClick={() => setMenuOpen(false)}>홈</Link>
            <Link href="/?category=AI모델" className="hover:text-brand-600" onClick={() => setMenuOpen(false)}>AI 모델</Link>
            <Link href="/?category=디자인툴" className="hover:text-brand-600" onClick={() => setMenuOpen(false)}>디자인 툴</Link>
            <Link href="/timeline" className="hover:text-brand-600" onClick={() => setMenuOpen(false)}>타임라인</Link>
          </nav>
        )}
      </div>
    </header>
    </>
  );
}
