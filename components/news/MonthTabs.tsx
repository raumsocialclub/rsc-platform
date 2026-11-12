import Link from "next/link";
import type { YM } from "@/lib/posts/calendar";

/** 1월~12월 칩 (Wanted DS Chip). 글이 있는 달은 진하게, 없는 달은 흐리게, 선택한 달은 파란 채움 */
export function MonthTabs({ year, month, months }: { year: number; month: number; months: YM[] }) {
  const has = new Set(months.filter((x) => x.y === year).map((x) => x.m));
  return (
    <nav aria-label="월 선택" className="flex gap-[8px] overflow-x-auto pb-[4px] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const on = m === month;
        const filled = has.has(m);
        return (
          <Link key={m} href={`/news?y=${year}&m=${m}`} aria-current={on ? "page" : undefined}
            className={`flex-none inline-flex items-center justify-center h-[36px] px-[14px] rounded-pill border t-label-1 font-semibold transition-colors ${on ? "bg-primary border-primary text-white hover:text-white" : filled ? "bg-white border-lineNeutral text-label hover:border-line" : "bg-white border-lineAlt text-labelAssist hover:text-labelAlt"}`}>
            {m}월
          </Link>
        );
      })}
    </nav>
  );
}
