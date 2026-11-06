import { describe, expect, it } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { crmTarget, matchInquiries, planInquirySync, syncInquiriesFromSheet, type InquirySyncRow } from "@/lib/crm/inquiries";
import { phoneDigits, phoneKey } from "@/lib/crm/parse";
import type { CallLead } from "@/lib/crm/types";

/** 상담 신청(inquiries) 상태 ↔ CRM 시트 콜 결과 연동. 전부 가상 데이터 */
const lead = (phone: string, calls: [string, string, string], o: Partial<CallLead> = {}): CallLead => {
  const filled = calls.filter(Boolean);
  const status = o.status ?? (filled.length === 0 ? "pending" : filled.some((c) => /완료/.test(c)) ? "done" : /부재/.test(filled[filled.length - 1]) ? "missed" : /거절/.test(filled[filled.length - 1]) ? "declined" : "callback");
  return {
    key: phoneKey(phone), tab: "CRM관리", tabs: ["CRM관리"], id: "l:1", createdAt: null, lastAt: null, channel: "meta", channels: ["meta"], subs: [],
    name: "가상", phone, platform: "ig", campaign: "", form: "", calls, memo: "", note: "", status, attempts: filled.length, last: filled[filled.length - 1] ?? "", ...o,
  };
};
const row = (id: string, phone: string | null, status: string, o: Partial<InquirySyncRow> = {}): InquirySyncRow => ({ id, phone, status, crm_applied: null, crm_status: null, crm_attempts: null, ...o });

describe("전화번호 키", () => {
  it("표기가 달라도 같은 번호면 같은 키 (010-…, +8210…, 메타 CSV p:+8210…)", () => {
    expect(phoneDigits("p:+821012345678")).toBe("01012345678");
    expect(phoneDigits("+82 10-1234-5678")).toBe("01012345678");
    expect(phoneDigits("010-1234-5678")).toBe("01012345678");
    expect(phoneKey("p:+821012345678")).toBe(phoneKey("010-1234-5678"));
    expect(phoneKey("02-123-4567")).not.toBe(phoneKey("010-1234-5678"));
  });
});

describe("시트 콜 결과 → 상담 신청 상태", () => {
  it("시도 없음 → 건드리지 않음, 통화·재통화·부재 → 상담 진행, 거절·없는 번호 → 보류", () => {
    expect(crmTarget({ status: "pending", attempts: 0 })).toBeNull();
    expect(crmTarget({ status: "done", attempts: 1 })).toBe("contacted");
    expect(crmTarget({ status: "missed", attempts: 2 })).toBe("contacted");
    expect(crmTarget({ status: "callback", attempts: 1 })).toBe("contacted");
    expect(crmTarget({ status: "other", attempts: 1 })).toBe("contacted");
    expect(crmTarget({ status: "declined", attempts: 1 })).toBe("closed");
    expect(crmTarget({ status: "invalid", attempts: 1 })).toBe("closed");
  });
  it("전화번호로 짝을 맞추고, 번호가 없거나 시트에 없는 신청은 빠진다", () => {
    const m = matchInquiries([row("a", "010-1111-2222", "pending"), row("b", null, "pending"), row("c", "010-9999-0000", "pending")], [lead("p:+821011112222", ["통화완료", "", ""])]);
    expect([...m.keys()]).toEqual(["a"]);
    expect(m.get("a")?.status).toBe("done");
  });
  it("대기 → 콜 기록이 생기면 상담 진행, 거절이면 보류. 콜 결과·횟수도 같이 적는다", () => {
    const up = planInquirySync(
      [row("a", "010-1111-2222", "pending"), row("b", "010-3333-4444", "pending"), row("c", "010-5555-6666", "pending")],
      [lead("010-1111-2222", ["부재중", "통화완료", ""]), lead("010-3333-4444", ["거절", "", ""]), lead("010-5555-6666", ["", "", ""])],
      "2026-10-28T00:00:00.000Z",
    );
    expect(up).toEqual([
      { id: "a", patch: { status: "contacted", crm_applied: "contacted", crm_status: "done", crm_attempts: 2, crm_synced_at: "2026-10-28T00:00:00.000Z" } },
      { id: "b", patch: { status: "closed", crm_applied: "closed", crm_status: "declined", crm_attempts: 1, crm_synced_at: "2026-10-28T00:00:00.000Z" } },
    ]);
  });
  it("초대 완료는 바꾸지 않고, 관리자가 직접 바꾼 상태(연동이 적은 것과 다름)는 존중한다 — 콜 결과만 갱신", () => {
    const leads = [lead("010-1111-2222", ["통화완료", "", ""]), lead("010-3333-4444", ["통화완료", "", ""]), lead("010-5555-6666", ["거절", "", ""])];
    const up = planInquirySync(
      [
        row("inv", "010-1111-2222", "invited"),
        row("manual", "010-3333-4444", "closed", { crm_applied: null }),         // 관리자가 보류로 둔 신청
        row("auto", "010-5555-6666", "contacted", { crm_applied: "contacted", crm_status: "missed", crm_attempts: 1 }), // 연동이 적은 상태 그대로 → 다시 적는다
      ],
      leads,
      "now",
    );
    expect(up.map((u) => [u.id, u.patch.status ?? null, u.patch.crm_status])).toEqual([
      ["inv", null, "done"],
      ["manual", null, "done"],
      ["auto", "closed", "declined"],
    ]);
  });
  it("아무것도 안 변했으면 쓰지 않는다 (같은 시트를 매번 읽어도 DB 쓰기 0)", () => {
    const up = planInquirySync([row("a", "010-1111-2222", "contacted", { crm_applied: "contacted", crm_status: "done", crm_attempts: 1 })], [lead("010-1111-2222", ["통화완료", "", ""])]);
    expect(up).toEqual([]);
  });
  it("DB 반영: 바뀐 신청만 update 하고 결과를 돌려준다. 실패해도 던지지 않는다", async () => {
    const db = fakeDb({ inquiries: [
      { id: "a", phone: "010-1111-2222", status: "pending", crm_applied: null, crm_status: null, crm_attempts: null, created_at: "2026-10-28" },
      { id: "b", phone: "010-7777-8888", status: "pending", crm_applied: null, crm_status: null, crm_attempts: null, created_at: "2026-10-28" },
    ] });
    const r = await syncInquiriesFromSheet(db.client as never, [lead("p:+821011112222", ["부재중", "", ""])]);
    expect(r).toMatchObject({ ok: true, updated: 1, matched: 1 });
    expect(db.calls.filter((c) => c.op === "update").map((c) => c.filters)).toEqual([[["eq", "id", "a"]]]);
    expect(db.tables.inquiries[0]).toMatchObject({ status: "contacted", crm_applied: "contacted", crm_status: "missed", crm_attempts: 1 });
    expect(db.tables.inquiries[1].status).toBe("pending");
    const bad = await syncInquiriesFromSheet({ from: () => { throw new Error("boom"); } } as never, []);
    expect(bad.ok).toBe(false);
  });
});
