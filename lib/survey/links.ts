import { TOKEN_RE, newToken } from "@/lib/apply/links";

/**
 * 회원 설문조사 비밀 링크 (/s/<토큰>). 상담 전 설문 링크(lib/apply/links.ts)와 같은 22자 base64url 토큰을 쓴다.
 * 관리자가 어드민 → 설문조사에서 링크를 만들어 문자로 보낸다. 사이트 어디에도 노출되지 않고(robots 제외) 토큰이 있어야만 열린다.
 * 마감은 관리자가 직접(closed_at) 하거나 마감일(closes_at)이 지나면 된다. 마감된 뒤에도 받은 응답은 남는다.
 */
export type SurveyRow = {
  id: string;
  kind: string;
  token: string;
  name: string;
  memo: string | null;
  created_at: string;
  closes_at: string | null;
  closed_at: string | null;
  last_response_at: string | null;
};
export type SurveyStatus = "open" | "closed" | "expired";
export const SURVEY_STATUS_KO: Record<SurveyStatus, string> = { open: "진행 중", closed: "마감", expired: "기간 종료" };
export const SURVEY_COLUMNS = "id, kind, token, name, memo, created_at, closes_at, closed_at, last_response_at";
export { TOKEN_RE, newToken };

export function surveyStatus(s: Pick<SurveyRow, "closed_at" | "closes_at">, now = new Date()): SurveyStatus {
  if (s.closed_at) return "closed";
  if (s.closes_at && new Date(s.closes_at).getTime() <= now.getTime()) return "expired";
  return "open";
}

/** 문자에 넣을 전체 주소. NEXT_PUBLIC_SITE_URL 이 없으면 상대 경로 */
export function surveyUrl(token: string, site = process.env.NEXT_PUBLIC_SITE_URL ?? ""): string {
  return `${site.replace(/\/$/, "")}/s/${token}`;
}

/** 문자 문구 초안의 {link} 를 실제 주소로 */
export const fillSms = (template: string, url: string): string => template.split("{link}").join(url);

/** 방문자에게 보일 안내 (열 수 없는 사유별) */
export const SURVEY_MESSAGE: Record<Exclude<SurveyStatus, "open"> | "invalid", string> = {
  closed: "이 설문은 마감되었습니다. 참여해 주셔서 감사합니다.",
  expired: "설문 응답 기간이 끝났습니다. 참여해 주셔서 감사합니다.",
  invalid: "유효하지 않은 설문 주소입니다. 문자로 받은 주소를 다시 확인해 주세요.",
};

type Db = { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/** 토큰으로 설문을 찾는다. 없으면 null. 열려 있는지는 surveyStatus 로 */
export async function findSurvey(db: Db, token: string): Promise<SurveyRow | null> {
  if (!TOKEN_RE.test(token)) return null;
  const { data } = await db.from("surveys").select(SURVEY_COLUMNS).eq("token", token).maybeSingle();
  return (data as SurveyRow | null) ?? null;
}
