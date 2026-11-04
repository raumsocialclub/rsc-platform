import { randomBytes } from "node:crypto";

/**
 * 상담 전 설문(/apply) 비밀 링크.
 * 전화 상담을 마치고 니즈가 확실한 분에게 관리자가 링크를 만들어 직접 전달한다. 사이트 어디에도 노출되지 않고,
 * 링크(토큰)가 있어야만 설문이 열리며 1회 제출 후 닫힌다. 기본 유효기간 30일, 관리자가 취소할 수 있다.
 * 응답은 상담 신청(inquiries)에 「설문」(answers.form = "apply") 행으로 저장되고 링크의 response_id 가 그 행을 가리킨다.
 */
export type ApplyLink = {
  id: string;
  token: string;
  name: string;
  phone: string | null;
  memo: string | null;
  inquiry_id: string | null;
  response_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};

export type ApplyLinkStatus = "active" | "used" | "expired" | "revoked";
export const APPLY_LINK_STATUS_KO: Record<ApplyLinkStatus, string> = { active: "전달 가능", used: "응답 완료", expired: "기간 만료", revoked: "취소됨" };

export const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
export const DEFAULT_LINK_DAYS = 30;

/** 16바이트 난수 → 22자 base64url. 추측 불가능한 비밀 링크용 */
export function newToken(): string {
  return randomBytes(16).toString("base64url");
}

export function linkStatus(l: Pick<ApplyLink, "used_at" | "revoked_at" | "expires_at">, now = new Date()): ApplyLinkStatus {
  if (l.used_at) return "used";
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
  used: "이미 제출된 설문 링크입니다. 응답해 주셔서 감사합니다.",
  expired: "설문 링크의 유효기간이 지났습니다. 담당자에게 새 링크를 요청해 주세요.",
  revoked: "더 이상 사용할 수 없는 설문 링크입니다. 담당자에게 새 링크를 요청해 주세요.",
  invalid: "유효하지 않은 설문 링크입니다. 전달받은 주소를 다시 확인하거나 담당자에게 문의해 주세요.",
};

type Db = { from: (table: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/** 토큰으로 링크를 찾는다. 없으면 null. 상태 판단은 linkStatus 로 */
export async function findLink(db: Db, token: string): Promise<ApplyLink | null> {
  if (!TOKEN_RE.test(token)) return null;
  const { data } = await db.from("apply_links").select("id, token, name, phone, memo, inquiry_id, response_id, created_at, expires_at, used_at, revoked_at").eq("token", token).maybeSingle();
  return (data as ApplyLink | null) ?? null;
}
