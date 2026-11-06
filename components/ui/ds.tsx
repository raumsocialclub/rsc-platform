import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 디자인 시스템 기본 조각 (Wanted Design System → Design.md). 공개 사이트·어드민 공용.
 * 버튼: Solid(주요) · Outlined(보조) · Assistive(약한) · Text. 크기 lg 48px / md 40px / sm 32px. 모서리 12px.
 */
export type BtnVariant = "solid" | "outlined" | "assistive" | "text" | "inverse";
export type BtnSize = "lg" | "md" | "sm";

const BASE = "inline-flex items-center justify-center gap-[6px] whitespace-nowrap rounded-ds font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out cursor-pointer select-none border active:scale-[.97] disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:shadow-none";
const SIZE: Record<BtnSize, string> = {
  lg: "h-[48px] px-[28px] text-[16px] leading-[1.5] tracking-[0.0057em]",
  md: "h-[40px] px-[20px] text-[15px] leading-[1.467] tracking-[0.0096em]",
  sm: "h-[32px] px-[14px] text-[13px] leading-[1.385] tracking-[0.0194em]",
};
const VARIANT: Record<BtnVariant, string> = {
  solid: "bg-primary border-primary text-white hover:bg-primaryStrong hover:border-primaryStrong hover:text-white hover:shadow-[0_6px_16px_rgba(0,102,255,.28)] active:bg-primaryHeavy active:shadow-none disabled:bg-disable disabled:border-disable disabled:text-labelDisable",
  outlined: "bg-transparent border-line text-primary hover:bg-[rgba(0,102,255,.05)] hover:text-primary disabled:text-labelDisable disabled:border-lineAlt",
  assistive: "bg-transparent border-line text-labelNeutral hover:bg-fillAlt hover:text-label disabled:text-labelDisable disabled:border-lineAlt",
  text: "bg-transparent border-transparent text-primary px-[8px] hover:bg-[rgba(0,102,255,.05)] hover:text-primary",
  inverse: "bg-white border-white text-label hover:bg-[#f4f4f5] hover:border-[#f4f4f5] hover:text-label hover:shadow-[0_6px_16px_rgba(0,0,0,.25)] active:shadow-none",
};

export function btn(variant: BtnVariant = "solid", size: BtnSize = "md", extra = ""): string {
  return `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${extra}`.trim();
}

type Common = { variant?: BtnVariant; size?: BtnSize; className?: string; children: ReactNode };
type LinkProps = Common & { href: string; external?: boolean; onClick?: () => void };
type ButtonProps = Common & { type?: "button" | "submit"; disabled?: boolean; onClick?: () => void; "aria-label"?: string };

/** 링크 버튼. 내부 경로는 next/link, 외부는 새 창 */
export function ButtonLink({ href, external, variant = "solid", size = "md", className = "", children, onClick }: LinkProps) {
  const cls = btn(variant, size, className);
  if (external || /^https?:/.test(href)) return <a href={href} target="_blank" rel="noreferrer" className={cls} onClick={onClick}>{children}</a>;
  return <Link href={href} className={cls} onClick={onClick}>{children}</Link>;
}

export function Button({ type = "button", disabled, onClick, variant = "solid", size = "md", className = "", children, ...rest }: ButtonProps) {
  return <button type={type} disabled={disabled} onClick={onClick} className={btn(variant, size, className)} aria-label={rest["aria-label"]}>{children}</button>;
}

/** 본문 폭 1060px + 좌우 여백 20px(모바일) / 32px */
export function Container({ className = "", children, wide = false }: { className?: string; children: ReactNode; wide?: boolean }) {
  return <div className={`w-full ${wide ? "max-w-[1200px]" : "max-w-content"} mx-auto px-[20px] md:px-[32px] ${className}`}>{children}</div>;
}

/** 섹션 머리: 작은 라벨(선택) + 제목 + 설명(선택) */
export function SectionHead({ eyebrow, title, lead, align = "left", className = "", reveal }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; align?: "left" | "center"; className?: string; reveal?: boolean }) {
  return (
    <div className={`${align === "center" ? "text-center mx-auto" : ""} max-w-[720px] ${className}`} data-reveal={reveal ? "" : undefined}>
      {eyebrow && <div className="t-eyebrow text-primary mb-[10px]">{eyebrow}</div>}
      <h2 className="t-title-2 md:t-title-1 text-label text-pretty">{title}</h2>
      {lead && <p className="t-body-1-reading text-labelAlt mt-[14px] text-pretty">{lead}</p>}
    </div>
  );
}

/** 카드: 흰 배경 · 1px 선 · 12px 모서리. tone="alt" 는 연회색 배경 */
export const CARD = "bg-white border border-lineAlt rounded-ds";
export const CARD_ALT = "bg-sand border border-transparent rounded-ds";
export const CARD_HOVER = "group transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-[4px] hover:shadow-md hover:border-lineNeutral";
/** 모바일 가로 스와이프 줄 (드래그로 넘김, 데스크톱은 그리드) */
export const SWIPE = "flex gap-[16px] overflow-x-auto snap-x snap-mandatory -mx-[20px] px-[20px] pb-[8px] scrollbar-none [-webkit-overflow-scrolling:touch] md:grid md:overflow-visible md:mx-0 md:px-0 md:pb-0 md:snap-none";
export const SWIPE_ITEM = "flex-none w-[82%] snap-start md:w-auto";

/** 입력칸 (Text Field): 48px, 12px 모서리, 포커스 시 파란 테두리 */
export const INPUT = "w-full h-[48px] rounded-ds border border-lineNeutral bg-white px-[16px] text-[16px] leading-[1.5] text-label outline-none shadow-xs transition-[border-color,box-shadow] duration-200 placeholder:text-labelAssist hover:border-line focus:border-primary focus:ring-2 focus:ring-[rgba(0,102,255,.2)] disabled:bg-disable disabled:text-labelDisable appearance-none";
export const TEXTAREA = "w-full min-h-[120px] rounded-ds border border-lineNeutral bg-white px-[16px] py-[12px] text-[16px] leading-[1.5] text-label outline-none shadow-xs transition-[border-color,box-shadow] duration-200 placeholder:text-labelAssist hover:border-line focus:border-primary focus:ring-2 focus:ring-[rgba(0,102,255,.2)] resize-y";
export const INPUT_ERR = "!border-negative focus:!ring-[rgba(255,66,66,.2)]";
export const FIELD_LABEL = "block t-label-1 font-semibold text-labelNeutral mb-[8px]";
export const FIELD_HELP = "block mt-[8px] t-caption-1 text-labelAlt";
export const FIELD_ERROR = "block mt-[8px] t-caption-1 text-negativeFg";

/** 칩(선택 버튼): 선택 안 됨 흰색 / 선택됨 파란 테두리·연파랑 */
export const CHIP = "min-h-[44px] inline-flex items-center justify-center text-center px-[16px] py-[10px] t-body-2 font-medium rounded-ds border cursor-pointer select-none transition-[color,background-color,border-color,transform] duration-200 active:scale-[.97]";
export const CHIP_ON = "border-primary bg-[rgba(0,102,255,.08)] text-primary";
export const CHIP_OFF = "border-lineNeutral bg-white text-labelNeutral hover:border-primary hover:text-primary";

/** 배지 */
export function Badge({ tone = "neutral", children, className = "", fit }: { tone?: "neutral" | "primary" | "positive" | "cautionary" | "negative" | "inverse"; children: ReactNode; className?: string; /** 긴 영어 문구: 줄을 바꾸지 않고 좁은 화면에서 글자를 줄인다 */ fit?: boolean }) {
  const t = {
    neutral: "bg-fill text-labelNeutral",
    primary: "bg-[rgba(0,102,255,.1)] text-primary",
    positive: "bg-[rgba(0,191,64,.12)] text-positiveFg",
    cautionary: "bg-[rgba(255,146,0,.14)] text-cautionaryFg",
    negative: "bg-[rgba(255,66,66,.12)] text-negativeFg",
    inverse: "bg-inverseBg text-inverseLabel",
  }[tone];
  return <span className={`inline-flex items-center h-[24px] px-[8px] rounded-ds-sm ${fit ? "t-badge-fit" : "t-caption-1"} font-semibold whitespace-nowrap max-w-full ${t} ${className}`}>{children}</span>;
}

/** 구분선 */
export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-lineAlt ${className}`} />;
}
