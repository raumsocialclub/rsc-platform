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
    <Link href={`/programs/${p.id}`} className="bg-white border border-[rgba(33,30,25,.1)] flex flex-col hover:border-brown text-ink hover:text-ink">
      <div className="relative h-[220px] bg-[#e7e0d3] overflow-hidden">
        {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="(max-width: 760px) 100vw, 33vw" className="object-cover" style={{ filter: "brightness(0.95) saturate(0.92)" }} />}
        <div className="absolute top-[14px] left-[14px] bg-[rgba(33,30,25,.75)] text-cream text-[10.5px] tracking-[.14em] px-[10px] py-[6px]">{categoryLabel(p.category)}</div>
        {soldOut && <div className="absolute inset-0 bg-[rgba(33,30,25,.55)] flex items-center justify-center text-cream text-[13px] tracking-[.2em]">SOLD OUT</div>}
      </div>
      <div className="px-[22px] pt-[22px] pb-[24px] flex-1 flex flex-col">
        <div className="text-[11.5px] tracking-[.06em] text-brownHover mb-[10px]">{sch.date}{sch.time ? ` · ${sch.time}` : ""}</div>
        <div className="text-[18px] font-semibold leading-[1.35] mb-[8px]">{p.name}</div>
        <div className="text-[13.5px] leading-[1.6] text-[rgba(33,30,25,.6)] mb-[18px] flex-1">{p.short_desc}</div>
        <div className="flex items-center justify-between border-t border-[rgba(33,30,25,.1)] pt-[16px]">
          <span className="text-[17px] font-semibold">{won(memberPrice(p))}</span>
          <span className="text-[12px] text-[rgba(33,30,25,.5)]">잔여 {remaining}석</span>
        </div>
      </div>
    </Link>
  );
}
