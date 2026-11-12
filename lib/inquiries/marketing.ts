import type { LeadTrack } from "@/components/fit-check/LeadForm";

/**
 * 마케팅 정보 수신 동의(선택) — 상담 신청(/fit-check) 개인정보 동의 아래 체크. (2026-11-12, 사용자 요청)
 * 상담 신청(inquiries)은 180일 뒤 지워지지만 수신 동의는 「철회 시까지」 유효해야 하므로 별도 표 marketing_consents 에 저장한다(크론이 지우지 않음).
 * 어드민 /admin/marketing 에서 목록·철회·CSV. 정보통신망법 제50조에 따라 2년마다 수신 동의 여부를 확인해야 하므로 재확인 예정일(동의일 + 2년)을 함께 보여준다.
 * 동의문 버전은 lib/legal/content.ts MARKETING_CONSENT_VERSION, 문구는 CMS apply.form(marketing*).
 */
export const MARKETING_CHANNELS = "전화, 문자, 카카오톡";
export const RECONFIRM_YEARS = 2;

export type MarketingConsentRow = {
  id: string;
  inquiry_id: string | null;
  name: string;
  phone: string;
  region: string | null;
  track: string | null;          // social | matching | undecided
  channels: string;
  consent_at: string;
  consent_version: string;
  withdrawn_at: string | null;
  withdrawn_by: string | null;
  created_at: string;
};

export const TRACK_KO: Record<string, string> = { social: "소셜클럽", matching: "1:1 매칭", undecided: "상담 후 결정" };
export const trackKo = (t: string | null | undefined): string => (t && TRACK_KO[t]) || "";

/** 2년마다 수신 동의 여부 확인 — 동의일 + 2년 (ISO) */
export function reconfirmDue(consentAt: string): string {
  const d = new Date(consentAt);
  d.setFullYear(d.getFullYear() + RECONFIRM_YEARS);
  return d.toISOString();
}
/** 재확인 예정일이 지났거나 30일 안인지 */
export function reconfirmSoon(consentAt: string, now = new Date()): boolean {
  return new Date(reconfirmDue(consentAt)).getTime() - now.getTime() < 30 * 86400_000;
}

export const isTrack = (v: unknown): v is LeadTrack => v === "social" || v === "matching" || v === "undecided";
