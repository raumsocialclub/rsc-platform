import { csvCell, toKstIso } from "@/lib/admin/leads";
import { reconfirmDue, trackKo, type MarketingConsentRow } from "@/lib/inquiries/marketing";

/** 마케팅 수신 동의 CSV 열. 값은 저장된 그대로(이름·휴대폰·거주지역·관심 방식·동의 일시(KST)·동의문 버전·채널·재확인 예정일·상태·철회 일시) */
export const MARKETING_CSV_COLUMNS = ["이름", "휴대폰", "거주지역", "관심 방식", "동의 일시", "동의문 버전", "수신 방법", "재확인 예정일", "상태", "철회 일시", "상담 신청 ID"] as const;

export function marketingCsvRow(r: MarketingConsentRow): string[] {
  return [r.name, r.phone, r.region ?? "", trackKo(r.track), toKstIso(r.consent_at), r.consent_version, r.channels, toKstIso(reconfirmDue(r.consent_at)).slice(0, 10), r.withdrawn_at ? "철회" : "동의", r.withdrawn_at ? toKstIso(r.withdrawn_at) : "", r.inquiry_id ?? ""];
}

/** BOM + CRLF (엑셀에서 한글·줄바꿈이 깨지지 않게) */
export function marketingCsv(rows: MarketingConsentRow[]): string {
  const head = MARKETING_CSV_COLUMNS.map((c) => `"${c}"`).join(",");
  const lines = rows.map((r) => marketingCsvRow(r).map(csvCell).join(","));
  return "﻿" + [head, ...lines].join("\r\n") + "\r\n";
}
