import Image from "next/image";
import Link from "next/link";
import { scheduleText, won } from "@/lib/programs/format";
import { bookingTarget } from "@/lib/programs/queries";
import { categoryLabel, memberPrice, type ProgramWithSessions } from "@/lib/programs/types";

/** deploy/member.html 프로그램 카드 재현 (220px 이미지 · 카테고리 태그 · SOLD OUT 오버레이) */
export function ProgramCard({ p }: { p: ProgramWithSessions }) {
  const sch = scheduleText(p.kind, p.sessions);
  const { remaining } = bookingTarget(p);
  const soldOut = remaining <= 0;
  return (
    <Link href={`/programs/${p.id}`} className="group bg-white border border-[rgba(112,115,124,.08)] flex flex-col hover:border-primary text-label hover:text-label">
      <div className="relative h-[220px] bg-[#f4f4f5] overflow-hidden img-live">
        {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 760px) 100vw, 33vw" className="object-cover" style={{ filter: "brightness(0.95) saturate(0.92)" }} />}
        <div className="absolute top-[14px] left-[14px] bg-[rgba(46,47,51,.88)] text-white text-[11px] tracking-[.14em] px-[10px] py-[6px]">{categoryLabel(p.category)}</div>
        {soldOut && <div className="absolute inset-0 bg-[rgba(55,56,60,.61)] flex items-center justify-center text-white text-[13px] tracking-[.02em]">SOLD OUT</div>}
      </div>
      <div className="px-[22px] pt-[22px] pb-[24px] flex-1 flex flex-col">
        <div className="text-[12px] tracking-[.06em] text-primaryStrong mb-[10px]">{sch.date}{sch.time ? ` · ${sch.time}` : ""}</div>
        <div className="text-[18px] font-semibold leading-[1.35] mb-[8px]">{p.name}</div>
        <div className="text-[14px] leading-[1.6] text-[rgba(55,56,60,.61)] mb-[18px] flex-1">{p.short_desc}</div>
        <div className="flex items-center justify-between border-t border-[rgba(112,115,124,.08)] pt-[16px]">
          <span className="text-[17px] font-semibold">{won(memberPrice(p))}</span>
          <span className="text-[12px] text-[rgba(55,56,60,.61)]">잔여 {remaining}석</span>
        </div>
      </div>
    </Link>
  );
}
