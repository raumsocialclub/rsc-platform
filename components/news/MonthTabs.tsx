import Link from "next/link";
import type { YM } from "@/lib/posts/calendar";

/**
 * 1월~12월 탭 (M16). 글이 있는 달은 진하게, 없는 달은 흐리게. 선택한 달은 잉크색 배경.
 * 데스크톱 12칸 한 줄, 태블릿 6칸 두 줄, 모바일 4칸 세 줄.
 */
export function MonthTabs({ year, month, months }: { year: number; month: number; months: YM[] }) {
  const has = new Set(months.filter((x) => x.y === year).map((x) => x.m));
  return (
    <nav aria-label="월 선택" className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 border border-[rgba(33,30,25,.16)] bg-white">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const on = m === month;
        const filled = has.has(m);
        return (
          <Link
            key={m}
            href={`/news?y=${year}&m=${m}`}
            aria-current={on ? "page" : undefined}
            className={`flex items-center justify-center h-[56px] md:h-[64px] text-[15px] md:text-[16px] border-[rgba(33,30,25,.16)] [&:not(:nth-child(4n))]:border-r sm:[&:not(:nth-child(4n))]:border-r-0 sm:[&:not(:nth-child(6n))]:border-r lg:[&:not(:nth-child(6n))]:border-r-0 lg:[&:not(:nth-child(12n))]:border-r [&:nth-child(-n+8)]:border-b sm:[&:nth-child(-n+8)]:border-b-0 sm:[&:nth-child(-n+6)]:border-b lg:[&:nth-child(-n+6)]:border-b-0 transition-colors ${on ? "bg-ink text-cream font-semibold" : filled ? "text-ink font-semibold hover:bg-[#f3eee4]" : "text-[rgba(33,30,25,.38)] hover:bg-[#f7f3ec]"}`}
          >
            {m}월{filled && !on ? <span aria-hidden className="ml-[5px] w-[5px] h-[5px] rounded-full bg-brownHover" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
