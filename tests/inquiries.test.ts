import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { MARKETING_CONSENT_VERSION, PRIVACY_CONSENT_VERSION } from "@/lib/legal/content";

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
    db.tables.marketing_consents = [];
  });
  it("관심 방식과 들어온 경로를 answers 에 저장하고, 이상한 경로 값은 버린다", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ ...base, route: "1:1 매칭", track: "matching", entryTrack: "matching", entryPath: "/matching" }));
    expect(res.status).toBe(200);
    const row = db.calls[0].payload as { answers: Record<string, string> };
    expect(row.answers.track).toBe("matching");
    expect(row.answers.entryTrack).toBe("matching");
    expect(row.answers.entryPath).toBe("/matching");
    db.calls.length = 0;
    const res2 = await POST(post({ ...base, track: "social", entryPath: "javascript:alert(1)" }));
    expect(res2.status).toBe(200);
    const row2 = db.calls[0].payload as { answers: Record<string, string | undefined> };
    expect(row2.answers.track).toBe("social");
    expect(row2.answers.entryPath).toBeUndefined();
    expect(row2.answers.entryTrack).toBeUndefined();
    const bad = await POST(post({ ...base, track: "vip" }));
    expect(bad.status).toBe(400);
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
    expect(row.answers.consentVersion).toBe(PRIVACY_CONSENT_VERSION);
  });
  it("직업·학력·거주지역(시/도)·시/군/구를 answers 에 그대로 저장한다 (2026-11-12 추가 항목)", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ ...base, job: "전문직", education: "대학원(석사) 졸업", region: "서울특별시", district: " 송파구 " }));
    expect(res.status).toBe(200);
    const a = (db.calls[0].payload as { answers: Record<string, string> }).answers;
    expect(a.job).toBe("전문직");
    expect(a.education).toBe("대학원(석사) 졸업");
    expect(a.region).toBe("서울특별시");
    expect(a.district).toBe("송파구");
  });
  it("직업·학력·거주지는 목록에 없는 값이면 400, 없으면(설문형 등) 그냥 생략", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const bad = await POST(post({ ...base, job: "회장님" }));
    expect(bad.status).toBe(400);
    const badRegion = await POST(post({ ...base, region: "전라북도" }));
    expect(badRegion.status).toBe(400);
    expect(db.calls.length).toBe(0);
    const ok = await POST(post({ ...base, district: "송파구" })); // 시/도 없이 시/군/구만 → 시/군/구도 버림
    expect(ok.status).toBe(200);
    const a = (db.calls[0].payload as { answers: Record<string, string> }).answers;
    expect(a).not.toHaveProperty("job");
    expect(a).not.toHaveProperty("region");
    expect(a).not.toHaveProperty("district");
  });
  it("마케팅 수신 동의(선택)에 체크하면 marketing_consents 에 따로 저장하고 answers 에도 남긴다; 체크 안 하면 표에 안 넣고 answers.marketing=false", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ ...base, track: "social", region: "경기도", marketing: true }));
    expect(res.status).toBe(200);
    expect(db.calls.map((c) => c.table)).toEqual(["inquiries", "marketing_consents"]);
    const a = (db.calls[0].payload as { answers: Record<string, unknown> }).answers;
    expect(a.marketing).toBe(true);
    expect(a.marketingVersion).toBe(MARKETING_CONSENT_VERSION);
    const m = db.calls[1].payload as Record<string, unknown>;
    expect(m).toMatchObject({ name: "홍길동", phone: "010-1234-5678", region: "경기도", track: "social", consent_version: MARKETING_CONSENT_VERSION });
    expect(typeof m.inquiry_id).toBe("string");
    db.calls.length = 0;
    const res2 = await POST(post({ ...base }));
    expect(res2.status).toBe(200);
    expect(db.calls.map((c) => c.table)).toEqual(["inquiries"]);
    expect((db.calls[0].payload as { answers: Record<string, unknown> }).answers.marketing).toBe(false);
  });
  it("상담 가능 시간을 비워도 접수된다 (선택 항목)", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    const res = await POST(post({ name: "홍길동", phone: "01012345678", consent: true }));
    expect(res.status).toBe(200);
    const row = db.calls[0].payload as { answers: Record<string, string> };
    expect(row.answers.slot).toBe("");
  });
  it("클라이언트가 보낸 동의 버전은 무시하고 서버 버전을 기록한다", async () => {
    const { POST } = await import("@/app/api/inquiries/route");
    await POST(post({ ...base, consentVersion: "9999-01-01" }));
    const row = db.calls[0].payload as { answers: Record<string, string> };
    expect(row.answers.consentVersion).toBe(PRIVACY_CONSENT_VERSION);
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
