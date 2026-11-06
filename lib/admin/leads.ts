import type { InquiryRow } from "@/components/admin/InquiryDetail";

/**
 * 상담 신청 → 메타(인스타그램·페이스북) 광고 관리자의 리드 CSV 양식.
 * 광고 관리자에서 내려받은 "Leads" 파일과 앞 14열이 같아 두 파일을 하나로 합쳐 유입 광고별 성과를 볼 수 있다.
 * 그 뒤에 원본 UTM 5열(utm_source … utm_content)을 그대로 붙여, 변환 과정에서 정보가 사라지지 않게 한다.
 *
 * 광고 UTM → 열 대응. 광고 링크를 메타 동적 매개변수로 만들면 그대로 들어온다:
 *   ?utm_source={{site_source_name}}&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}
 *   utm_campaign → campaign_id / campaign_name   utm_term → adset_id / adset_name   utm_content → ad_id / ad_name
 *   (값이 메타 ID 꼴(숫자 10자리 이상)이면 *_id 열, 아니면 *_name 열. 이름을 ID 로 바꾸지는 않는다)   utm_source → platform (ig / fb …)
 *
 * is_organic 판정 — utm_source 가 ig/fb 라도 프로필 링크·일반 게시물 유입일 수 있으므로 매체만으로 광고라고 하지 않는다:
 *   "false"(광고)  utm_medium 이 유료 표기(paid, cpc, paid_social …)이거나 캠페인·세트·광고 중 하나라도 메타 ID 꼴일 때
 *   "true"(광고 아님)  utm_medium 이 organic, social, profile, bio 등 무료 표기일 때
 *   ""(판단 불가)  UTM 이 없거나(링크 기록이 없을 뿐, 광고를 본 뒤 다른 브라우저로 신청했을 수도 있음) 매체 표기가 없을 때.
 *     확정하지 않고 비워 두며, 원본 UTM 열로 사람이 판단한다.
 *
 * 엑셀 호환: 메타 ID 처럼 긴 숫자는 엑셀이 지수(1.2E+17)로 바꾸고 16자리부터 0 으로 잃는다. 숫자만으로 된 값은 ="…" 로 감싸
 * 텍스트로 열리게 한다(우리가 만든 상수 식이라 수식 삽입과 무관). 사람이 넣을 수 있는 값(이름·UTM)은 = + - @ 로 시작하면
 * 앞에 ' 를 붙여 수식으로 실행되지 않게 한다 (OWASP CSV injection).
 */
export const LEAD_COLUMNS = ["id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "form_id", "form_name", "is_organic", "platform", "full_name", "phone_number"] as const;
export const UTM_RAW_COLUMNS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
export const CSV_COLUMNS = [...LEAD_COLUMNS, ...UTM_RAW_COLUMNS] as const;
export type LeadRow = Record<(typeof CSV_COLUMNS)[number], string>;

/** 메타 리드 파일의 form_id 는 메타 양식 번호라 우리 사이트 신청에는 고정 식별자를 넣는다. */
export const LEAD_FORM = { id: "rsc-website", name: "라움소셜클럽 웹사이트 상담 신청" } as const;

export type LeadSource = Pick<InquiryRow, "id" | "name" | "phone" | "created_at" | "utm">;
export type UtmFilter = { source: string; campaign: string };

/** CSV 기간(한국 날짜 YYYY-MM-DD, 양 끝 포함). null 이면 전체. */
export type LeadRange = { from: string; to: string };
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v?: string | null): v is string => !!v && DAY_RE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00+09:00`).getTime());

/**
 * 쿼리스트링 from/to → 기간. 둘 다 올바른 날짜이고 from ≤ to 일 때만 기간을 쓰고, 그 밖(비어 있음·형식 오류·역순)은 null(전체).
 * 하나만 있으면 그 날 하루로 본다.
 */
export function parseLeadRange(sp: { from?: string | null; to?: string | null }): LeadRange | null {
  const from = isDay(sp.from) ? sp.from : null;
  const to = isDay(sp.to) ? sp.to : null;
  if (from && to) return from <= to ? { from, to } : null;
  if (from) return { from, to: from };
  if (to) return { from: to, to };
  return null;
}

/** 기간 → DB 비교용 UTC 경계. from 00:00 KST 이상, to 다음날 00:00 KST 미만. */
export function leadRangeBounds(r: LeadRange): { gte: string; lt: string } {
  const end = new Date(`${r.to}T00:00:00+09:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: new Date(`${r.from}T00:00:00+09:00`).toISOString(), lt: end.toISOString() };
}

/** 상담 목록 화면과 CSV 가 같은 유입 필터를 쓴다. source "-" 는 UTM 기록이 없는 신청. */
export function matchesUtmFilter(r: Pick<InquiryRow, "utm">, f: UtmFilter): boolean {
  const okSource = !f.source || (f.source === "-" ? !r.utm?.utm_source : r.utm?.utm_source === f.source);
  const okCampaign = !f.campaign || r.utm?.utm_campaign === f.campaign;
  return okSource && okCampaign;
}

/** 메타 광고 ID(캠페인·세트·광고)는 숫자만으로 된 긴 번호. 그 꼴이면 *_id, 아니면 *_name 에 그대로 둔다. */
const META_ID = /^\d{10,}$/;
export const isMetaId = (v: string | undefined): v is string => !!v && META_ID.test(v);
const splitIdName = (v: string | undefined): [id: string, name: string] => (!v ? ["", ""] : isMetaId(v) ? [v, ""] : ["", v]);

/** 메타 리드 파일의 platform 값(ig / fb)에 맞춘다. 그 외 매체는 받은 값 그대로. */
const PLATFORM: Record<string, string> = { ig: "ig", instagram: "ig", fb: "fb", facebook: "fb", meta: "fb" };

const PAID_MEDIUM = new Set(["paid", "cpc", "ppc", "cpm", "paid_social", "paidsocial", "paid-social", "ads", "ad", "display", "retargeting"]);
const FREE_MEDIUM = new Set(["organic", "social", "profile", "bio", "link", "referral", "email", "qr", "story", "post"]);

/** 광고 여부. "false" 광고 / "true" 광고 아님 / "" 판단 불가 (주석 참고) */
export function isOrganic(utm: InquiryRow["utm"]): "true" | "false" | "" {
  if (!utm) return "";
  const medium = utm.utm_medium?.trim().toLowerCase() ?? "";
  if (PAID_MEDIUM.has(medium) || isMetaId(utm.utm_campaign) || isMetaId(utm.utm_term) || isMetaId(utm.utm_content)) return "false";
  if (FREE_MEDIUM.has(medium)) return "true";
  return "";
}

/** 메타 리드 파일의 created_time 꼴: 2026-10-20T14:32:11+09:00 (한국 시간) */
export function toKstIso(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  return new Date(t + 9 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+09:00";
}

/**
 * 메타 리드 파일의 phone_number 꼴: p:+821012345678.
 * 공백·하이픈·괄호·점만 걷어내고, 한국 번호(0으로 시작 9~11자리: 휴대폰·지역번호)는 0 → +82, 이미 82/+82 로 시작하면 그대로 +82.
 * 그 밖의 꼴은 손대지 않고 원본을 그대로 둔다. 빈 값은 "".
 */
export function toLeadPhone(phone: string | null | undefined): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  const d = raw.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (/^82\d{8,10}$/.test(d)) return `p:+${d}`;
  if (/^0\d{8,10}$/.test(d)) return `p:+82${d.slice(1)}`;
  return raw;
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
    is_organic: isOrganic(utm),
    platform: source ? (PLATFORM[source] ?? source) : "",
    full_name: r.name ?? "",
    phone_number: toLeadPhone(r.phone),
    utm_source: utm?.utm_source ?? "",
    utm_medium: utm?.utm_medium ?? "",
    utm_campaign: utm?.utm_campaign ?? "",
    utm_term: utm?.utm_term ?? "",
    utm_content: utm?.utm_content ?? "",
  };
}

/** 셀 하나. 숫자만이면 ="…" (엑셀 텍스트 유지), 수식 시작 글자면 ' 를 앞에 붙임, 나머지는 "…" 로 감싸고 " 는 "" 로. */
export function csvCell(v: string): string {
  if (/^\d+$/.test(v)) return `"=""${v}"""`;
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** 엑셀용 BOM + CRLF. 앞 14열은 메타 리드 파일과 동일, 뒤 5열은 원본 UTM. */
export function leadsCsv(rows: LeadSource[]): string {
  const head = CSV_COLUMNS.map((c) => `"${c}"`).join(",");
  const lines = rows.map((r) => { const l = toLeadRow(r); return CSV_COLUMNS.map((c) => csvCell(l[c])).join(","); });
  return "﻿" + [head, ...lines].join("\r\n");
}
