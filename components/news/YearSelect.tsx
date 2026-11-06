"use client";

import { useRouter } from "next/navigation";

/** 소식 연도 선택 — 바꾸면 그 해의 같은 달로 이동 */
export function YearSelect({ years, year, month }: { years: number[]; year: number; month: number }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center cursor-pointer">
      <span className="sr-only">연도 선택</span>
      <select value={year} onChange={(e) => router.push(`/news?y=${e.target.value}&m=${month}`)} className="appearance-none h-[40px] pl-[14px] pr-[36px] rounded-ds border border-lineNeutral bg-white t-body-2 font-semibold text-label cursor-pointer outline-none focus:border-primary" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23171719' stroke-width='1.8'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
        {years.map((y) => <option key={y} value={y}>{y}년</option>)}
      </select>
    </label>
  );
}
