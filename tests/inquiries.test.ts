import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";

/** 상담 신청 저장(/api/inquiries): 개인정보 최소화(설문 원본 미저장) + 광고 UTM 저장 */
const db = fakeDb();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => false, createAdminClient: () => db.client }));

const post = (body: unknown) => new Request("https://test.example/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const base = { name: "홍길동", phone: "010-1234-5678", slot: "오후 2–4시, 저녁 6–8시", consent: true };

describe("상담 신청 POST /api/inquiries", () => {
  beforeEach(() => {
    db.calls.length = 0;
    db.tables.inquiries = [];
  });
  it("간단 신청: 이름·휴대폰·가능 시간·동의 시각만 저장하고 결과 유형은 null", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post(base));
    expect(res.status).toBe(200);
    const row = db.calls[0].payload as { answers: Record<string, string>; result_type: unknown; utm: unknown; email: unknown };
    expect(row.result_type).toBeNull();
    expect(row.utm).toBeNull();
    expect(row.email).toBeNull();
    expect(row.answers.slot).toBe("오후 2–4시, 저녁 6–8시");
    expect(row.answers.route).toBe("");
    expect(row.answers.consentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it("설문형 신청: 결과 유형·경로는 저장하되 설문 답변 원본은 버린다", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ ...base, route: "인스타그램", resultType: "THE SETTLER", picks: { q1: 2, q2: 0 }, answers: [{ key: "q1", label: "라이프스타일", question: "주말엔?", answer: "전시" }] }));
    expect(res.status).toBe(200);
    const row = db.calls[0].payload as { answers: Record<string, string>; result_type: string };
    expect(row.result_type).toBe("THE SETTLER");
    expect(row.answers.route).toBe("인스타그램");
    expect(JSON.stringify(row)).not.toContain("전시");
    expect(JSON.stringify(row)).not.toContain("picks");
  });
  it("개인정보 동의 없이는 400, DB 호출 없음", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ ...base, consent: false }));
    expect(res.status).toBe(400);
    expect((await res.json()).message).toContain("동의");
    expect(db.calls).toHaveLength(0);
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

describe("휴대폰 입력 자동 하이픈", () => {
  it("숫자만 쳐도 010-0000-0000 꼴이 된다", async () => {
    const { formatPhoneInput } = await import("@/lib/phone");
    expect(formatPhoneInput("010")).toBe("010");
    expect(formatPhoneInput("0101234")).toBe("010-1234");
    expect(formatPhoneInput("01012345")).toBe("010-123-45");
    expect(formatPhoneInput("01012345678")).toBe("010-1234-5678");
    expect(formatPhoneInput("010-1234-5678")).toBe("010-1234-5678");
    expect(formatPhoneInput("010 1234 5678 99")).toBe("010-1234-5678");
    expect(formatPhoneInput("0111234567")).toBe("011-123-4567");
  });
});
