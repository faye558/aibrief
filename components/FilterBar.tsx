"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { COMPANIES, CATEGORIES } from "@/types/article";

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCompany = searchParams.get("company") ?? "전체";
  const currentCategory = searchParams.get("category") ?? "전체";

  function updateFilter(key: "company" | "category", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "전체") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      {/* 회사 필터 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">회사</p>
        <div className="flex flex-wrap gap-2">
          {COMPANIES.map((company) => (
            <button
              key={company}
              onClick={() => updateFilter("company", company)}
              className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
                currentCompany === company
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {company}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">카테고리</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => updateFilter("category", category)}
              className={`text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
                currentCategory === category
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
