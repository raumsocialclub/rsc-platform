import type { CSSProperties } from "react";
import { btn } from "@/components/ui/ds";

/** 어드민 공통 조각 (Wanted DS · Design.md). 공개 사이트와 같은 토큰을 쓰되 표·폼 밀도는 조금 높게 */
export const CARD = "bg-white border border-lineAlt rounded-ds";
export const TH = "text-left text-[12px] font-semibold text-labelAlt px-[14px] py-[11px] bg-sand border-b border-lineAlt whitespace-nowrap first:rounded-tl-ds last:rounded-tr-ds";
export const TD = "text-[14px] text-labelNeutral px-[14px] py-[12px] border-b border-lineAlt align-middle whitespace-nowrap";
export const BTN_PRIMARY = btn("solid", "md");
export const BTN_SECONDARY = btn("assistive", "md");
export const FIELD = "w-full min-w-0 min-h-[40px] px-[12px] py-[8px] text-[14px] leading-[1.5] text-label rounded-ds-sm border border-lineNeutral bg-white outline-none shadow-xs transition-[border-color,box-shadow] duration-200 placeholder:text-labelAssist hover:border-line focus:border-primary focus:ring-2 focus:ring-[rgba(0,102,255,.2)] disabled:bg-disable disabled:text-labelDisable";

export function PageTitle({ overline, title, aside, children }: { overline: string; title: React.ReactNode; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-[20px] flex-wrap mb-[24px]">
      <div>
        <div className="text-[12px] font-semibold text-primary mb-[6px]">{overline}</div>
        <h1 className="t-title-3 md:t-title-2 text-label m-0">{title} {aside}</h1>
      </div>
      {children}
    </div>
  );
}

export function Badge({ style, children }: { style: CSSProperties; children: React.ReactNode }) {
  return <span className="inline-flex items-center h-[22px] text-[12px] font-semibold px-[8px] rounded-ds-sm whitespace-nowrap" style={style}>{children}</span>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-[32px] text-center text-[14px] text-labelAlt whitespace-normal">{children}</td>
    </tr>
  );
}
