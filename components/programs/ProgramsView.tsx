import Link from "next/link";
import { ProgramCard } from "./ProgramCard";
import { CATEGORIES, SEASON_CATEGORY, categoryLabel, type ProgramWithSessions } from "@/lib/programs/types";

/** deploy/member.html PROGRAMS 뷰: 제목 + 카테고리 필터(pill) + 3열 카드 그리드 (모바일 1열) */
export function ProgramsView({ programs, filter, greeting }: { programs: ProgramWithSessions[]; filter: string; greeting?: string | null }) {
  const cats: string[] = [...CATEGORIES];
  if (programs.some((p) => p.category === SEASON_CATEGORY)) cats.push(SEASON_CATEGORY);
  const active = cats.includes(filter) ? filter : "ALL";
  const visible = active === "ALL" ? programs : programs.filter((p) => p.category === active);

  return (
    <>
      <div className="flex items-end justify-between gap-[24px] flex-wrap mb-[40px]">
        <div>
          <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[16px]">UPCOMING PROGRAMS</div>
          <h1 className="font-medium text-[28px] md:text-[clamp(28px,3.4vw,42px)] leading-[1.3] m-0">이번 달 프로그램</h1>
        </div>
        <div className="flex gap-[8px] flex-wrap">
          {[{ key: "ALL", label: "전체" }, ...cats.map((c) => ({ key: c, label: categoryLabel(c) }))].map((f) => {
            const on = f.key === active;
            return (
              <Link
                key={f.key}
                href={f.key === "ALL" ? "/programs" : `/programs?cat=${f.key}`}
                className="border border-[rgba(33,30,25,.2)] px-[16px] py-[8px] rounded-pill text-[12.5px] font-semibold hover:text-brownHover"
                style={{ background: on ? "#5a3d24" : "transparent", color: on ? "#f7f3ec" : "#5a3d24" }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="bg-cream border border-[rgba(33,30,25,.14)] px-[28px] py-[56px] text-center">
          <div className="text-[15px] font-medium mb-[8px]">{greeting ? `${greeting}님, ` : ""}{active === "ALL" ? "아직 열린 프로그램이 없습니다." : `${categoryLabel(active)} 프로그램이 아직 없습니다.`}</div>
          <div className="text-[13.5px] leading-[1.7] text-[rgba(33,30,25,.6)]">프로그램이 열리면 이곳에 표시됩니다.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
          {visible.map((p) => <ProgramCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}
