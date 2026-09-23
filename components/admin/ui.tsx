import type { CSSProperties } from "react";

/** 어드민 공통 조각 (design/RSC Admin.dc.html 스타일) */
export const CARD = "bg-white border border-[rgba(33,30,25,.1)]";
export const TH = "text-left text-[11.5px] tracking-[.08em] text-[rgba(33,30,25,.5)] font-semibold px-[14px] py-[12px] border-b border-[rgba(33,30,25,.12)] whitespace-nowrap";
export const TD = "text-[13.5px] p-[14px] border-b border-[rgba(33,30,25,.08)] align-middle whitespace-nowrap";
export const BTN_PRIMARY = "border-0 bg-brown text-cream px-[20px] py-[11px] text-[13px] font-semibold cursor-pointer hover:bg-brownHover disabled:opacity-60 disabled:cursor-not-allowed";
export const BTN_SECONDARY = "border border-[rgba(33,30,25,.2)] bg-transparent px-[16px] py-[11px] text-[13px] cursor-pointer hover:border-brownHover hover:text-brownHover disabled:opacity-60";
export const FIELD = "w-full min-w-0 px-[12px] py-[10px] text-[13px] border border-[rgba(33,30,25,.2)] bg-white outline-none rounded-none focus:border-brown";

export function PageTitle({ overline, title, aside, children }: { overline: string; title: React.ReactNode; aside?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-[20px] flex-wrap mb-[28px]">
      <div>
        <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[10px]">{overline}</div>
        <h1 className="font-medium text-[30px] m-0">{title} {aside}</h1>
      </div>
      {children}
    </div>
  );
}

export function Badge({ style, children }: { style: CSSProperties; children: React.ReactNode }) {
  return <span className="text-[11.5px] px-[10px] py-[4px] whitespace-nowrap" style={style}>{children}</span>;
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-[32px] text-center text-[13px] text-[rgba(33,30,25,.5)] whitespace-normal">{children}</td>
    </tr>
  );
}
