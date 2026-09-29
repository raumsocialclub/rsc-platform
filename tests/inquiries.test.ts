import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/** 상담 신청 저장(/api/inquiries): 개인정보 최소화(설문 원본 미저장) + 광고 UTM 저장 */
const db = fakeDb();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => false, createAdminClient: () => db.client }));

const post = (body: unknown) => new Request("https://test.example/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const base = { name: "홍길동", phone: "010-1234-5678", route: "인스타그램", slot: "평일 저녁", resultType: "THE SETTLER" };

describe("상담 신청 POST /api/inquiries", () => {
  beforeEach(() => {
    db.calls.length = 0;
    db.tables.inquiries = [];
  });
  it("이름·휴대폰·희망 시간·유입 경로·결과 유형만 저장하고 설문 답변 원본은 버린다", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ ...base, picks: { q1: 2, q2: 0 }, answers: [{ key: "q1", label: "라이프스타일", question: "주말엔?", answer: "전시" }] }));
    expect(res.status).toBe(200);
    const row = db.calls[0].payload as Record<string, unknown>;
    expect(row).toEqual({ name: "홍길동", phone: "010-1234-5678", email: null, answers: { route: "인스타그램", slot: "평일 저녁" }, result_type: "THE SETTLER", utm: null });
    expect(JSON.stringify(row)).not.toContain("전시");
    expect(JSON.stringify(row)).not.toContain("picks");
  });
  it("광고 UTM 은 값이 있는 항목만 저장한다 (100자 제한)", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    await POST(post({ ...base, utm: { utm_source: "instagram", utm_medium: "", utm_campaign: "oct-launch", utm_content: undefined } }));
    const row = db.calls[0].payload as { utm: unknown };
    expect(row.utm).toEqual({ utm_source: "instagram", utm_campaign: "oct-launch" });
  });
  it("UTM 값이 너무 길면 400", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    expect((await POST(post({ ...base, utm: { utm_source: "x".repeat(101) } }))).status).toBe(400);
  });
  it("휴대폰 형식이 틀리면 400, DB 호출 없음", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    expect((await POST(post({ ...base, phone: "12" }))).status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });
});
