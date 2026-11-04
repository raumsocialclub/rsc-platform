import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { ALL_FIELDS, STEPS, displayAnswer, flattenAnswers, missingRequired, sanitizeAnswers, FIELD_BY_KEY } from "@/lib/apply/schema";

/** 상담 전 설문(/apply): 레퍼런스 8단계 문항 정의 · 서버 정제 · 저장. 전부 가상 데이터 */
const db = fakeDb();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => true, createAdminClient: () => db.client }));

const TOKEN = "AbCdEfGhIjKlMnOpQrStUv";
const post = (body: Record<string, unknown>) => new Request("https://test.example/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TOKEN, ...body }) });
const future = new Date(Date.now() + 86_400_000).toISOString();
const link = (over: Record<string, unknown> = {}) => ({ id: "link-1", token: TOKEN, name: "11월 전화상담", memo: null, uses: 0, last_used_at: null, created_at: new Date().toISOString(), expires_at: future, revoked_at: null, ...over });
const base = { name: "홍길동", gender: "남성", birth: "1989-01-06", phone: "01012345678" };

describe("문항 정의", () => {
  it("레퍼런스 8단계가 순서대로 있고 키는 겹치지 않는다", () => {
    expect(STEPS.map((s) => s.title)).toEqual(["기본 정보", "학력", "직업", "자산정보", "가족관계", "이상형 우선 순위", "이상형 기피사항", "연애성향 질문"]);
    const keys = ALL_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(ALL_FIELDS.filter((f) => f.required).map((f) => f.key)).toEqual(["name", "gender", "birth", "phone"]);
    expect(STEPS[7].fields).toHaveLength(13);
  });
  it("필수 칸이 비면 그 칸을 돌려준다", () => {
    expect(missingRequired(STEPS[0], { name: "홍", gender: "남성" })?.key).toBe("birth");
    expect(missingRequired(STEPS[0], base)).toBeNull();
    expect(missingRequired(STEPS[1], {})).toBeNull();
  });
});

describe("정제·표시", () => {
  it("선택지 밖의 값·모르는 키·잘못된 숫자/날짜는 버리고, 기타 입력은 남긴다", () => {
    const a = sanitizeAnswers({ ...base, hacked: "x", gender: "외계인", marital: "미혼", salary: "abc", height: "180", birth: "1989/01/06", look: "기타", lookOther: "키 큰 사람", idealRegions: ["서울", "화성", "제주"], avoidEtc: "a".repeat(3000) });
    expect(a.hacked).toBeUndefined();
    expect(a.gender).toBeUndefined();
    expect(a.marital).toBe("미혼");
    expect(a.salary).toBeUndefined();
    expect(a.height).toBe("180");
    expect(a.birth).toBeUndefined();
    expect(a.look).toBe("기타");
    expect(a.lookOther).toBe("키 큰 사람");
    expect(a.idealRegions).toEqual(["서울", "제주"]);
    expect((a.avoidEtc as string).length).toBe(2000);
  });
  it("표시용 답: 단위·기타·복수 선택", () => {
    expect(displayAnswer(FIELD_BY_KEY.salary, { salary: "85000000" })).toBe("85,000,000원");
    expect(displayAnswer(FIELD_BY_KEY.look, { look: "기타", lookOther: "자연스러운" })).toBe("기타(자연스러운)");
    expect(displayAnswer(FIELD_BY_KEY.idealJobs, { idealJobs: ["금융권", "기타"], idealJobsOther: "스타트업" })).toBe("금융권, 기타(스타트업)");
    expect(displayAnswer(FIELD_BY_KEY.siblings, { siblings: "1남 2녀 중 1째" })).toBe("1남 2녀 중 1째");
  });
  it("어드민 상세용 평탄화: 이름·전화·이메일은 빼고 답이 있는 칸만 단계 순서로", () => {
    const rows = flattenAnswers({ ...base, email: "a@b.c", education: "대학 졸업", t1: "허용할 수 없다", drinking: "가끔마셔요" });
    expect(rows.map((r) => r.key)).toEqual(["gender", "birth", "drinking", "education", "t1"]);
    expect(rows[3]).toMatchObject({ label: "학력 · 최종학력", answer: "대학 졸업" });
  });
});

describe("POST /api/apply (비밀 링크)", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.inquiries = []; db.tables.apply_links = [link()]; });
  it("토큰이 없거나 모르는 토큰이면 거부, DB 저장 없음", async () => {
    const { POST } = await import("@/app/api/apply/route");
    expect((await POST(new Request("https://test.example/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: base, consent: true }) }))).status).toBe(400);
    expect((await POST(post({ token: "zzzzzzzzzzzzzzzzzzzzzz", answers: base, consent: true }))).status).toBe(403);
    expect(db.tables.inquiries).toHaveLength(0);
  });
  it("만료·취소된 링크는 403", async () => {
    const { POST } = await import("@/app/api/apply/route");
    db.tables.apply_links = [link({ expires_at: new Date(Date.now() - 1000).toISOString() })];
    expect((await POST(post({ answers: base, consent: true }))).status).toBe(403);
    db.tables.apply_links = [link({ revoked_at: new Date().toISOString() })];
    expect((await POST(post({ answers: base, consent: true }))).status).toBe(403);
    expect(db.tables.inquiries).toHaveLength(0);
  });
  it("동의 없으면 400, 필수 칸 없으면 400 (응답 수 그대로)", async () => {
    const { POST } = await import("@/app/api/apply/route");
    expect((await POST(post({ answers: base, consent: false }))).status).toBe(400);
    expect((await POST(post({ answers: { ...base, phone: "123" }, consent: true }))).status).toBe(400);
    expect((await POST(post({ answers: { ...base, gender: "" }, consent: true }))).status).toBe(400);
    expect(db.tables.inquiries).toHaveLength(0);
    expect(db.tables.apply_links[0].uses).toBe(0);
  });
  it("저장: 이름·전화(정규화)·이메일은 컬럼, 나머지는 answers (form=apply, linkId, 평탄화 + 원본), 같은 링크로 여러 명이 제출할 수 있고 응답 수가 올라간다", async () => {
    const { POST } = await import("@/app/api/apply/route");
    const res = await POST(post({ answers: { ...base, email: "x@y.z", joinRoute: "SNS 광고", refCode: "RSC01", salary: "90000000", idealRegions: ["서울"], t13: "한 명이어도 충분하다", hacked: "x" }, consent: true }));
    expect(res.status).toBe(200);
    const row = db.tables.inquiries[0] as { id: string; name: string; phone: string; email: string; result_type: unknown; utm: unknown; answers: { form: string; linkId: string; route: string; ref: string; consentVersion: string; answers: { key: string; answer: string }[]; apply: Record<string, unknown> } };
    expect(row.name).toBe("홍길동");
    expect(row.phone).toBe("010-1234-5678");
    expect(row.email).toBe("x@y.z");
    expect(row.result_type).toBeNull();
    expect(row.utm).toBeNull();
    expect(row.answers.form).toBe("apply");
    expect(row.answers.linkId).toBe("link-1");
    expect(row.answers.route).toBe("SNS 광고");
    expect(row.answers.ref).toBe("RSC01");
    expect(row.answers.consentVersion).toBeTruthy();
    expect(row.answers.answers.find((x) => x.key === "salary")?.answer).toBe("90,000,000원");
    expect(row.answers.apply.hacked).toBeUndefined();
    expect(row.answers.apply.name).toBeUndefined();
    expect(row.answers.apply.t13).toBe("한 명이어도 충분하다");
    const l = db.tables.apply_links[0] as { uses: number; last_used_at: string | null };
    expect(l.uses).toBe(1);
    expect(l.last_used_at).toBeTruthy();
    // 같은 링크로 다른 사람이 또 보내도 된다 (로그인 없이, 횟수 제한 없음)
    expect((await POST(post({ answers: { ...base, name: "김영희", phone: "01099998888" }, consent: true }))).status).toBe(200);
    expect(db.tables.inquiries).toHaveLength(2);
    expect((db.tables.apply_links[0] as { uses: number }).uses).toBe(2);
  });
});
