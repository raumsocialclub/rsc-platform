import { createHash } from "node:crypto";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import type { CallEvent, CallField, CallLead } from "./types";

const EVENT_KEEP_DAYS = 30;
const RECENT_LIMIT = 60;

type StateRow = { lead_key: string; calls: unknown; memo: string | null; note_hash: string | null };
const noteHash = (note: string) => (note ? createHash("sha256").update(note).digest("hex").slice(0, 24) : "");
const noteLabel = (note: string) => (note ? `${note.split(/\r?\n/).filter((l) => l.trim()).length}줄` : "");
type EventRow = { id: number; lead_key: string; tab: string; field: CallField; before: string; after: string; at: string };

/**
 * 시트를 읽을 때마다 지난 상태(crm_call_state)와 비교해 바뀐 칸을 crm_call_events 에 남긴다 (실시간 변경 피드).
 * 개인정보는 저장하지 않는다 — 키·탭·셀 글만. 인터뷰 노트는 내용 대신 해시와 줄 수만 남긴다. 첫 실행(상태 테이블이 빔)은 기준선만 잡고 이벤트를 만들지 않는다.
 * service role 키가 없으면 기록을 건너뛴다(화면은 그대로 동작).
 */
export async function syncCallEvents(leads: CallLead[]): Promise<{ enabled: boolean; events: Omit<CallEvent, "name">[] }> {
  if (!hasServiceRoleKey()) return { enabled: false, events: [] };
  try {
    const db = createAdminClient();
    const { data: states, error } = await db.from("crm_call_state").select("lead_key, calls, memo, note_hash");
    if (error) throw error;
    const prev = new Map<string, StateRow>((states ?? []).map((s) => [s.lead_key, s as StateRow]));
    // 키 체계가 바뀌어(탭|id → p:전화해시) 지난 상태와 하나도 안 맞으면 기준선을 다시 잡는다 — 전부 '새 신청'으로 쏟아지지 않게
    const overlap = leads.some((l) => prev.has(l.key));
    const firstRun = prev.size === 0 || (!overlap && leads.length > 0);
    if (firstRun && prev.size > 0) {
      const stale = Array.from(prev.keys()).filter((k) => !k.startsWith("p:"));
      for (let i = 0; i < stale.length; i += 200) await db.from("crm_call_state").delete().in("lead_key", stale.slice(i, i + 200));
    }
    const now = new Date().toISOString();
    const upserts: { lead_key: string; tab: string; calls: string[]; memo: string; note_hash: string; changed_at: string }[] = [];
    const events: Omit<EventRow, "id">[] = [];
    const push = (l: CallLead, field: CallField, before: string, after: string) => events.push({ lead_key: l.key, tab: l.tab, field, before, after, at: now });

    for (const l of leads) {
      const p = prev.get(l.key);
      if (!p) {
        upserts.push({ lead_key: l.key, tab: l.tab, calls: l.calls, memo: l.memo, note_hash: noteHash(l.note), changed_at: now });
        if (!firstRun) push(l, "new", "", l.last);
        continue;
      }
      const pc = Array.isArray(p.calls) ? (p.calls as unknown[]).map((c) => (c == null ? "" : String(c))) : [];
      let changed = false;
      (["call1", "call2", "call3"] as const).forEach((f, i) => {
        if ((pc[i] ?? "") !== l.calls[i]) { changed = true; push(l, f, pc[i] ?? "", l.calls[i]); }
      });
      if ((p.memo ?? "") !== l.memo) { changed = true; push(l, "memo", p.memo ?? "", l.memo); }
      const nh = noteHash(l.note);
      if ((p.note_hash ?? "") !== nh) { changed = true; push(l, "note", p.note_hash ? "수정 전" : "", noteLabel(l.note)); }
      if (changed) upserts.push({ lead_key: l.key, tab: l.tab, calls: l.calls, memo: l.memo, note_hash: nh, changed_at: now });
    }

    if (upserts.length) {
      const { error: e1 } = await db.from("crm_call_state").upsert(upserts, { onConflict: "lead_key" });
      if (e1) throw e1;
    }
    if (events.length) {
      const { error: e2 } = await db.from("crm_call_events").insert(events);
      if (e2) throw e2;
    }
    await db.from("crm_call_events").delete().lt("at", new Date(Date.now() - EVENT_KEEP_DAYS * 86_400_000).toISOString());

    const { data: recent } = await db.from("crm_call_events").select("id, lead_key, tab, field, before, after, at").order("at", { ascending: false }).limit(RECENT_LIMIT);
    return {
      enabled: true,
      events: ((recent ?? []) as EventRow[]).map((r) => ({ id: r.id, key: r.lead_key, tab: r.tab, field: r.field, before: r.before, after: r.after, at: r.at })),
    };
  } catch (e) {
    console.error("[crm/events]", e);
    return { enabled: false, events: [] };
  }
}
