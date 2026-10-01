"use client";

import { useRouter } from "next/navigation";

/** 소식 연도 선택 — 바꾸면 그 해의 같은 달로 이동 (달에 글이 없으면 서버가 가까운 달로 보정하지 않고 빈 화면을 보여준다) */
export function YearSelect({ years, year, month }: { years: number[]; year: number; month: number }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-[6px] font-semibold text-[26px] md:text-[30px] leading-none text-ink cursor-pointer">
      <span className="sr-only">연도 선택</span>
      <select value={year} onChange={(e) => router.push(`/news?y=${e.target.value}&m=${month}`)} className="appearance-none bg-transparent border-0 p-0 pr-[26px] font-semibold text-[26px] md:text-[30px] leading-none text-ink cursor-pointer outline-none focus-visible:underline" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23211e19' stroke-width='1.6'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 2px center" }}>
        {years.map((y) => <option key={y} value={y}>{y}년</option>)}
      </select>
    </label>
  );
}
