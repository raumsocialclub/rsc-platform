import type { InquiryRow } from "@/components/admin/InquiryDetail";

/**
 * 상담 신청 → 메타(인스타그램·페이스북) 광고 관리자의 리드 CSV 양식.
 * 광고 관리자에서 내려받은 "Leads" 파일과 열이 같아 두 파일을 하나로 합쳐 유입 광고별 성과를 볼 수 있다.
 *
 * 광고 UTM → 열 대응. 광고 링크를 메타 동적 매개변수로 만들면 그대로 들어온다:
 *   ?utm_source={{site_source_name}}&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}
 *   utm_campaign → campaign_id / campaign_name   utm_term → adset_id / adset_name   utm_content → ad_id / ad_name
 *   (값이 숫자만이면 *_id 열, 아니면 *_name 열)   utm_source → platform (ig / fb …)   광고 링크 없이 온 신청 → is_organic = true
 */
export const LEAD_COLUMNS = ["id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "form_id", "form_name", "is_organic", "platform", "full_name", "phone_number"] as const;
export type LeadRow = Record<(typeof LEAD_COLUMNS)[number], string>;

/** 메타 리드 파일의 form_id 는 메타 양식 번호라 우리 사이트 신청에는 고정 식별자를 넣는다. */
export const LEAD_FORM = { id: "rsc-website", name: "라움소셜클럽 웹사이트 상담 신청" } as const;

export type LeadSource = Pick<InquiryRow, "id" | "name" | "phone" | "created_at" | "utm">;
export type UtmFilter = { source: string; campaign: string };

/** 상담 목록 화면과 CSV 가 같은 유입 필터를 쓴다. source "-" 는 광고 아닌 직접 유입. */
export function matchesUtmFilter(r: Pick<InquiryRow, "utm">, f: UtmFilter): boolean {
  const okSource = !f.source || (f.source === "-" ? !r.utm?.utm_source : r.utm?.utm_source === f.source);
  const okCampaign = !f.campaign || r.utm?.utm_campaign === f.campaign;
  return okSource && okCampaign;
}

/** 메타 광고 ID(캠페인·세트·광고)는 숫자만으로 된 긴 번호. 그 꼴이면 *_id, 아니면 *_name. */
const META_ID = /^\d{10,}$/;
const splitIdName = (v: string | undefined): [id: string, name: string] => (!v ? ["", ""] : META_ID.test(v) ? [v, ""] : ["", v]);

/** 메타 리드 파일의 platform 값(ig / fb)에 맞춘다. 그 외 매체는 받은 값 그대로. */
const PLATFORM: Record<string, string> = { ig: "ig", instagram: "ig", fb: "fb", facebook: "fb", meta: "fb" };

/** 메타 리드 파일의 created_time 꼴: 2026-10-20T14:32:11+09:00 (한국 시간) */
export function toKstIso(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  return new Date(t + 9 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+09:00";
}

/** 메타 리드 파일의 phone_number 꼴: p:+821012345678 (010-1234-5678 → 국가번호 82) */
export function toLeadPhone(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return `p:+82${digits.replace(/^0/, "")}`;
}

export function toLeadRow(r: LeadSource): LeadRow {
  const utm = r.utm ?? null;
  const [ad_id, ad_name] = splitIdName(utm?.utm_content);
  const [adset_id, adset_name] = splitIdName(utm?.utm_term);
  const [campaign_id, campaign_name] = splitIdName(utm?.utm_campaign);
  const source = utm?.utm_source?.trim().toLowerCase() ?? "";
  return {
    id: r.id,
    created_time: toKstIso(r.created_at),
    ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name,
    form_id: LEAD_FORM.id,
    form_name: LEAD_FORM.name,
    is_organic: source ? "false" : "true",
    platform: source ? (PLATFORM[source] ?? source) : "",
    full_name: r.name ?? "",
    phone_number: toLeadPhone(r.phone),
  };
}

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** 엑셀용 BOM + CRLF. 열 순서는 LEAD_COLUMNS (메타 리드 파일과 동일). */
export function leadsCsv(rows: LeadSource[]): string {
  const head = LEAD_COLUMNS.map(esc).join(",");
  const lines = rows.map((r) => { const l = toLeadRow(r); return LEAD_COLUMNS.map((c) => esc(l[c])).join(","); });
  return "﻿" + [head, ...lines].join("\r\n");
}
