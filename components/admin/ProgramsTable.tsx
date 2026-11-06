import Image from "next/image";
import Link from "next/link";
import { CARD, TH, TD as TD0, Badge, EmptyRow, PageTitle } from "./ui";

const TD = `${TD0} px-[10px]`;
const TH2 = `${TH} px-[10px]`;
import { ProgramRowActions } from "./ProgramRowActions";
import { badgeStyle } from "@/lib/admin/format";
import { scheduleText, won } from "@/lib/programs/format";
import { bookingTarget } from "@/lib/programs/queries";
import { categoryLabel, type ProgramWithSessions } from "@/lib/programs/types";

export type ProgramTab = "all" | "single" | "season";
const TABS: { key: ProgramTab; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "single", label: "단일 프로그램" },
  { key: "season", label: "RAUM SOLO 시즌" },
];

/** 프로그램 상태 (프로토타입 statusStyle 규칙) */
export function programStatus(p: ProgramWithSessions, now = new Date()): { label: string; style: { background: string; color: string } } {
  if (!p.is_published) return { label: "비공개", style: badgeStyle("mute") };
  const live = p.sessions.filter((s) => s.status !== "cancelled");
  if (live.length === 0) return { label: "일정 없음", style: badgeStyle("warn") };
  const last = live[live.length - 1];
  if (new Date(last.starts_at).getTime() < now.getTime()) return { label: "종료", style: badgeStyle("mute") };
  if (bookingTarget(p).remaining <= 0) return { label: "마감", style: badgeStyle("bad") };
  return { label: "판매중", style: badgeStyle("ok") };
}

/** design/RSC Admin.dc.html PROGRAMS 뷰 */
export function ProgramsTable({ programs, tab }: { programs: ProgramWithSessions[]; tab: ProgramTab }) {
  const rows = programs.filter((p) => tab === "all" || p.kind === tab);
  return (
    <>
      <PageTitle overline="PROGRAMS" title="프로그램 관리">
        <div className="flex gap-[8px]">
          <Link href="/admin/programs/new?kind=season" className="border border-primary bg-transparent text-primary px-[18px] py-[11px] text-[13px] font-semibold hover:text-primaryStrong hover:border-primary">+ RAUM SOLO 시즌</Link>
          <Link href="/admin/programs/new" className="border-0 bg-primary text-white px-[20px] py-[11px] text-[13px] font-semibold hover:bg-primaryStrong hover:text-white">+ 새 프로그램 등록</Link>
        </div>
      </PageTitle>
      <div className="flex gap-[6px] mb-[16px]">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/programs" : `/admin/programs?tab=${t.key}`}
              className="border border-[rgba(112,115,124,.22)] px-[16px] py-[8px] rounded-pill text-[13px] font-semibold"
              style={{ background: active ? "#0066ff" : "transparent", color: active ? "#ffffff" : "#0066ff" }}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["프로그램", "유형", "카테고리", "일정", "장소", "판매가", "예약/정원", "상태", ""].map((h, i) => <th key={i} className={TH2}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={9}>등록된 프로그램이 없습니다. 오른쪽 위 &quot;+ 새 프로그램 등록&quot; 으로 시작하세요.</EmptyRow>}
              {rows.map((p) => {
                const sch = scheduleText(p.kind, p.sessions);
                const { remaining } = bookingTarget(p);
                const cap = p.sessions[0]?.capacity ?? p.capacity;
                const booked = Math.max(0, cap - remaining);
                const st = programStatus(p);
                return (
                  <tr key={p.id} className="hover:bg-[rgba(112,115,124,.05)]">
                    <td className={`${TD} whitespace-normal min-w-[200px]`}>
                      <Link href={`/admin/programs/${p.id}`} className="flex items-center gap-[12px]">
                        <div className="w-[52px] h-[38px] bg-[#f4f4f5] relative overflow-hidden flex-none">
                          {p.image_url && <Image src={p.image_url} alt="" fill sizes="52px" className="object-cover" />}
                        </div>
                        <b>{p.name}</b>
                      </Link>
                    </td>
                    <td className={`${TD} text-[13px] text-[rgba(55,56,60,.61)]`}>{p.kind === "season" ? "시즌권" : "단일 회차"}</td>
                    <td className={TD}><span className="text-[11px] tracking-[.1em] px-[8px] py-[3px] bg-[rgba(112,115,124,.08)]">{categoryLabel(p.category)}</span></td>
                    <td className={TD}>{sch.date}<span className="block text-[12px] text-[rgba(55,56,60,.61)]">{sch.time}</span></td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)] whitespace-normal min-w-[110px]`}>{p.place || "—"}</td>
                    <td className={TD}><b>{won(p.price)}</b>{p.member_price != null && p.member_price !== p.price && <span className="block text-[12px] text-[rgba(55,56,60,.61)]">회원 {won(p.member_price)}</span>}</td>
                    <td className={TD}>
                      <div className="flex items-center gap-[8px]">
                        <span>{booked}/{cap}</span>
                        <div className="w-[60px] h-[5px] bg-[rgba(112,115,124,.08)]"><div className="h-full bg-primary" style={{ width: `${cap ? Math.round((booked / cap) * 100) : 0}%` }} /></div>
                      </div>
                    </td>
                    <td className={TD}><ProgramRowActions id={p.id} published={p.is_published} badge={<Badge style={st.style}>{st.label}</Badge>} /></td>
                    <td className={`${TD} pl-0`}><Link href={`/admin/programs/${p.id}`} className="border border-[rgba(112,115,124,.22)] px-[12px] py-[6px] text-[12px] hover:border-primary hover:text-primaryStrong">편집</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
