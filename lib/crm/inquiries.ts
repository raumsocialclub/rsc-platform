import type { SupabaseClient } from "@supabase/supabase-js";
import { phoneDigits, phoneKey } from "./parse";
import type { CallLead, CallStatus } from "./types";

/**
 * 상담 신청(inquiries 테이블) ↔ CRM 시트 연동.
 * CRM 팀이 CRM관리 탭에 1·2·3차 콜 결과를 적으면 어드민 「상담 신청」의 상태가 따라간다 — 전화번호가 같은 신청을 찾아
 *   콜 시도 있음(통화완료·재통화·부재중·기타) → 상담 진행(contacted), 거절·보류·없는 번호 → 보류(closed).
 * 규칙:
 *   - 초대 완료(invited)는 절대 바꾸지 않는다 (초대코드가 이미 나간 신청)
 *   - 관리자가 직접 바꾼 상태는 존중한다: 연동이 마지막으로 적은 상태(crm_applied)와 지금 상태가 같을 때(또는 대기일 때)만 다시 적는다
 *   - 시트 콜 칸이 비면(미진행) 상태를 되돌리지 않는다
 * 시트의 콜 결과·시도 횟수는 crm_status·crm_attempts 에 같이 적어 목록에서 바로 보이게 한다. 메모·노트는 DB 에 저장하지 않고 화면에서만 보여준다.
 */
export type InquiryStatus = "pending" | "contacted" | "invited" | "closed";
export type InquiryCrm = { key: string; status: CallStatus; attempts: number; calls: [string, string, string]; last: string; memo: string; note: string; sheetName: string; channel: string };
export type InquirySyncRow = { id: string; phone: string | null; status: string; crm_applied: string | null; crm_status: string | null; crm_attempts: number | null };
export type InquiryPatch = { status?: InquiryStatus; crm_applied?: InquiryStatus; crm_status: CallStatus; crm_attempts: number; crm_synced_at: string };
export type InquiryUpdate = { id: string; patch: InquiryPatch };

/** 시트 콜 결과 → 상담 신청 상태. 시도가 없으면 null (건드리지 않음) */
export function crmTarget(lead: Pick<CallLead, "status" | "attempts">): InquiryStatus | null {
  if (lead.attempts === 0 || lead.status === "pending") return null;
  if (lead.status === "declined" || lead.status === "invalid") return "closed";
  return "contacted";
}

/** 전화번호로 신청 ↔ 시트 리드 짝 맞추기. 번호가 없거나 시트에 없는 신청은 빠진다 */
export function matchInquiries<T extends { id: string; phone: string | null }>(rows: T[], leads: CallLead[]): Map<string, InquiryCrm> {
  const byKey = new Map(leads.map((l) => [l.key, l]));
  const out = new Map<string, InquiryCrm>();
  for (const r of rows) {
    if (!r.phone || !phoneDigits(r.phone)) continue;
    const l = byKey.get(phoneKey(r.phone));
    if (!l) continue;
    out.set(r.id, { key: l.key, status: l.status, attempts: l.attempts, calls: l.calls, last: l.last, memo: l.memo, note: l.note, sheetName: l.name, channel: l.channel });
  }
  return out;
}

/** 무엇을 바꿀지 계산 (DB 는 건드리지 않음 — 테스트하기 쉽게) */
export function planInquirySync(rows: InquirySyncRow[], leads: CallLead[], now = new Date().toISOString()): InquiryUpdate[] {
  const crm = matchInquiries(rows, leads);
  const out: InquiryUpdate[] = [];
  for (const r of rows) {
    const c = crm.get(r.id);
    if (!c) continue;
    const target = crmTarget(c);
    const mine = r.status === "pending" || (r.crm_applied != null && r.status === r.crm_applied); // 관리자가 손대지 않은 상태인가
    const changeStatus = !!target && target !== r.status && r.status !== "invited" && mine;
    const metaChanged = (r.crm_status ?? "pending") !== c.status || (r.crm_attempts ?? 0) !== c.attempts; // 시트에 콜이 없는 신청은 적을 것도 없다
    if (!changeStatus && !metaChanged) continue;
    const patch: InquiryPatch = { crm_status: c.status, crm_attempts: c.attempts, crm_synced_at: now };
    if (changeStatus && target) { patch.status = target; patch.crm_applied = target; }
    out.push({ id: r.id, patch });
  }
  return out;
}

const SYNC_LIMIT = 2000; // 상담 기록은 180일 뒤 지워지므로 이보다 많이 쌓이지 않는다

/**
 * 시트 리드로 inquiries 를 갱신한다. 관리자 세션 클라이언트(RLS admin 정책)나 service role 클라이언트 모두 가능.
 * 실패해도 던지지 않고 결과만 돌려준다 (화면은 그대로 동작).
 */
export async function syncInquiriesFromSheet(db: SupabaseClient, leads: CallLead[]): Promise<{ ok: boolean; updated: number; matched: number; error?: string }> {
  try {
    const { data, error } = await db.from("inquiries").select("id, phone, status, crm_applied, crm_status, crm_attempts").order("created_at", { ascending: false }).limit(SYNC_LIMIT);
    if (error) throw error;
    const rows = (data ?? []) as InquirySyncRow[];
    const updates = planInquirySync(rows, leads);
    for (const u of updates) {
      const { error: e } = await db.from("inquiries").update(u.patch).eq("id", u.id);
      if (e) throw e;
    }
    return { ok: true, updated: updates.length, matched: matchInquiries(rows, leads).size };
  } catch (e) {
    console.error("[crm/inquiries]", e);
    return { ok: false, updated: 0, matched: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
