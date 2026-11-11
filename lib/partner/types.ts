/** 제휴문의 (/partner → partner_inquiries). 문의 유형은 제휴문의 페이지의 협업 분야 3종 + 기타, 상태는 어드민 /admin/partners 에서 바꾼다. */
export const PARTNER_KINDS = ["brand", "corporate", "venue", "other"] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];
export const PARTNER_KIND_KO: Record<PartnerKind, string> = { brand: "브랜드 · 콘텐츠 협업", corporate: "기업 · 단체 제휴", venue: "공간 · 행사 협업", other: "기타 제안" };

export const PARTNER_STATUSES = ["new", "reviewing", "done", "declined"] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];
export const PARTNER_STATUS_KO: Record<PartnerStatus, string> = { new: "접수", reviewing: "검토 중", done: "진행 · 완료", declined: "보류" };

export type PartnerInquiryRow = {
  id: string;
  kind: PartnerKind;
  company: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: PartnerStatus;
  memo: string | null;
  files: { path: string; name: string; size: number }[];
  consent_at: string;
  consent_version: string | null;
  created_at: string;
  updated_at: string;
};

/** 제휴문의 개인정보 동의문 버전. 수집 항목·목적·기간(1년)을 바꾸면 올린다. */
export const PARTNER_CONSENT_VERSION = "2026-11-11";
