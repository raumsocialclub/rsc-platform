import { randomBytes } from "node:crypto";

/**
 * 상담 전 설문(/apply/<토큰>) 공용 비밀 링크.
 * 관리자가 어드민에서 링크를 만들어(예: "11월 전화상담 완료자") 전화 상담을 마친 분들에게 전달한다. 받은 사람은 로그인 없이 바로 설문하고,
 * 링크는 누구에게든 다시 전달할 수 있다(횟수 제한 없음). 사이트 어디에도 노출되지 않고 링크(토큰)가 있어야만 열린다.
 * 기본 유효기간 90일, 관리자가 취소할 수 있다. 응답은 상담 신청(inquiries)에 「설문」(answers.form = "apply", answers.linkId) 행으로 쌓인다.
 */
export type ApplyLink = {
  id: string;
  token: string;
  name: string;          // 링크 이름(용도)
  memo: string | null;
  uses: number;          // 응답 수
  last_used_at: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type ApplyLinkStatus = "active" | "expired" | "revoked";
export const APPLY_LINK_STATUS_KO: Record<ApplyLinkStatus, string> = { active: "사용 중", expired: "기간 만료", revoked: "취소됨" };

export const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
export const DEFAULT_LINK_DAYS = 90;

/** 16바이트 난수 → 22자 base64url. 추측 불가능한 비밀 링크용 */
export function newToken(): string {
  return randomBytes(16).toString("base64url");
}

export function linkStatus(l: Pick<ApplyLink, "revoked_at" | "expires_at">, now = new Date()): ApplyLinkStatus {
  if (l.revoked_at) return "revoked";
  if (new Date(l.expires_at).getTime() <= now.getTime()) return "expired";
  return "active";
}

/** 전달용 전체 주소. NEXT_PUBLIC_SITE_URL 이 없으면 상대 경로 */
export function applyLinkUrl(token: string, site = process.env.NEXT_PUBLIC_SITE_URL ?? ""): string {
  return `${site.replace(/\/$/, "")}/apply/${token}`;
}

/** 방문자에게 보일 안내 (유효하지 않은 링크 사유별) */
export const LINK_MESSAGE: Record<Exclude<ApplyLinkStatus, "active"> | "invalid", string> = {
  expired: "설문 링크의 유효기간이 지났습니다. 담당자에게 새 링크를 요청해 주세요.",
  revoked: "더 이상 사용할 수 없는 설문 링크입니다. 담당자에게 새 링크를 요청해 주세요.",
  invalid: "유효하지 않은 설문 링크입니다. 전달받은 주소를 다시 확인하거나 담당자에게 문의해 주세요.",
};

type Db = { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

export const LINK_COLUMNS = "id, token, name, memo, uses, last_used_at, created_at, expires_at, revoked_at";

/** 토큰으로 링크를 찾는다. 없으면 null. 상태 판단은 linkStatus 로 */
export async function findLink(db: Db, token: string): Promise<ApplyLink | null> {
  if (!TOKEN_RE.test(token)) return null;
  const { data } = await db.from("apply_links").select(LINK_COLUMNS).eq("token", token).maybeSingle();
  return (data as ApplyLink | null) ?? null;
}
