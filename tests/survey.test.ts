import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { DEMAND_2027, OTHER, displaySurveyAnswer, missingSurveyAnswer, sanitizeSurveyAnswers, summarizeSurvey, surveyDef } from "@/lib/survey/definitions";
import { surveyCsv, surveyCsvColumns, surveySummary, type SurveyResponseRow } from "@/lib/survey/export";
import { SURVEY_MESSAGE, fillSms, surveyStatus, surveyUrl } from "@/lib/survey/links";

/** 회원 설문조사(/s/<토큰>, 2027 프로그램 수요조사): 문항 정의 · 정제 · 집계 · CSV · 제출/관리 API. 전부 가상 데이터 */
const db = fakeDb();
let me: { id: string; role: string } | null = { id: "11111111-1111-4111-8111-111111111111", role: "owner" };
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => true, createAdminClient: () => db.client }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));
vi.mock("@/lib/admin/log", () => ({ logAdmin: async () => {} }));

const TOKEN = "AbCdEfGhIjKlMnOpQrStUv";
const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
const survey = (over: Record<string, unknown> = {}) => ({ id: "s-1", kind: "demand2027", token: TOKEN, name: "11월 발송", memo: null, created_at: new Date().toISOString(), closes_at: future, closed_at: null, last_response_at: null, ...over });
const good = { interest: ["TASTE TABLE", "ART WALK"], network: ["라운지에서 자유롭게 대화하기"], size: "중규모 (20~40명)", fee: "10~15만원", factors: ["프로그램 주제", "참여비"] };
const post = (body: Record<string, unknown>) => new Request("https://test.example/api/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: TOKEN, ...body }) });

describe("문항 정의", () => {
  it("PART 1 관심 분야(1·2순위, 7개 + 기타) → PART 2 네트워킹(최대 2)·규모·참여비·중요 요소(최대 3, 기타)", () => {
    const keys = DEMAND_2027.questions.map((q) => q.key);
    expect(keys).toEqual(["interest", "network", "size", "fee", "factors"]);
    expect(new Set(keys).size).toBe(keys.length);
    const q1 = DEMAND_2027.questions[0];
    expect(q1.type).toBe("rank"); expect(q1.ranks).toBe(2); expect(q1.part).toBe("PART 1. 관심 프로그램 분야");
    expect(q1.options.map((o) => o.value)).toEqual(["TASTE TABLE", "SOCIAL WELLNESS", "ART WALK", "ONE QUESTION SALON", "AFTER HOURS", "SOCIAL TIME", OTHER]);
    expect(DEMAND_2027.questions[1]).toMatchObject({ type: "multi", max: 2, exclusive: "상관없음", part: "PART 2. 모임 방식", no: "Q1" });
    expect(DEMAND_2027.questions[4]).toMatchObject({ type: "multi", max: 3, other: true, no: "Q4" });
    expect(DEMAND_2027.questions[4].options).toHaveLength(10);
    expect(surveyDef("demand2027")).toBe(DEMAND_2027); expect(surveyDef("nope")).toBeNull();
    // 톤: 만남·매칭 표현 없음
    expect(JSON.stringify(DEMAND_2027)).not.toMatch(/매칭|만남/);
  });
  it("정제: 선택지 밖·모르는 키 제거, 순위는 2개까지, 복수는 최대 수·배타(상관없음), 기타 입력은 기타를 골랐을 때만 100자", () => {
    const a = sanitizeSurveyAnswers(DEMAND_2027, { ...good, hacked: "x", interest: ["TASTE TABLE", "화성", "ART WALK", "AFTER HOURS", "TASTE TABLE"], network: ["라운지에서 자유롭게 대화하기", "상관없음"], factors: ["프로그램 주제", "참여비", "호스트·강사", "일정(요일·시간)", OTHER], factorsOther: "주차", interestOther: "버려짐" });
    expect(a.hacked).toBeUndefined();
    expect(a.interest).toEqual(["TASTE TABLE", "ART WALK"]);
    expect(a.network).toEqual(["상관없음"]);
    expect(a.factors).toEqual(["프로그램 주제", "참여비", "호스트·강사"]);
    expect(a.factorsOther).toBeUndefined(); // 기타가 3개 안에 못 들어갔으니 입력도 버림
    expect(a.interestOther).toBeUndefined();
    const b = sanitizeSurveyAnswers(DEMAND_2027, { ...good, interest: [OTHER, "SOCIAL TIME"], interestOther: " 북클럽 ".padEnd(150, "a") });
    expect(b.interest).toEqual([OTHER, "SOCIAL TIME"]);
    expect((b.interestOther as string).length).toBe(100);
    expect(sanitizeSurveyAnswers(DEMAND_2027, { size: "초대형" }).size).toBeUndefined();
  });
  it("모자란 답: 순위는 정확히 2개, 나머지는 1개 이상 · 표시용 문자열", () => {
    expect(missingSurveyAnswer(DEMAND_2027, good)).toBeNull();
    expect(missingSurveyAnswer(DEMAND_2027, { ...good, interest: ["TASTE TABLE"] })?.key).toBe("interest");
    expect(missingSurveyAnswer(DEMAND_2027, { ...good, fee: "" })?.key).toBe("fee");
    const q1 = DEMAND_2027.questions[0];
    expect(displaySurveyAnswer(q1, { interest: [OTHER, "ART WALK"], interestOther: "북클럽" })).toBe("1순위 기타(북클럽) · 2순위 ART WALK");
    expect(displaySurveyAnswer(DEMAND_2027.questions[1], good)).toBe("라운지에서 자유롭게 대화하기");
    expect(surveySummary(DEMAND_2027, good)).toBe("1순위 TASTE TABLE · 2순위 ART WALK");
  });
  it("집계: 순위형은 1순위 2점·2순위 1점 합산 순, 복수·단일은 수 순, 기타 입력 모음", () => {
    const rows = [good, { ...good, interest: ["ART WALK", "TASTE TABLE"], factors: [OTHER], factorsOther: "주차 편의" }, { ...good, interest: ["ART WALK", "SOCIAL TIME"], fee: "상관없음" }];
    const [s1, , , s4, s5] = summarizeSurvey(DEMAND_2027, rows);
    expect(s1.answered).toBe(3);
    expect(s1.options[0]).toMatchObject({ value: "ART WALK", byRank: [2, 1], score: 5, count: 3 });
    expect(s1.options[1]).toMatchObject({ value: "TASTE TABLE", byRank: [1, 1], score: 3 });
    expect(s4.options[0]).toMatchObject({ value: "10~15만원", count: 2 });
    expect(s5.others).toEqual(["주차 편의"]);
    expect(s5.options.find((o) => o.value === "프로그램 주제")?.count).toBe(2);
  });
});

describe("링크·CSV", () => {
  it("상태: 마감 > 기간 종료 > 진행 중 · 주소 · 문자 문구 {link}", () => {
    const now = new Date("2026-11-18T00:00:00Z");
    expect(surveyStatus({ closed_at: null, closes_at: "2026-12-01T00:00:00Z" }, now)).toBe("open");
    expect(surveyStatus({ closed_at: null, closes_at: null }, now)).toBe("open");
    expect(surveyStatus({ closed_at: null, closes_at: "2026-11-17T00:00:00Z" }, now)).toBe("expired");
    expect(surveyStatus({ closed_at: "2026-11-10T00:00:00Z", closes_at: "2026-12-01T00:00:00Z" }, now)).toBe("closed");
    expect(surveyUrl("abc", "https://rsc-platform.vercel.app/")).toBe("https://rsc-platform.vercel.app/s/abc");
    expect(fillSms(DEMAND_2027.sms, "https://x/s/abc")).toContain("참여링크: https://x/s/abc");
    expect(fillSms(DEMAND_2027.sms, "u")).toMatch(/^\(광고\)/);
  });
  it("CSV: 응답 일시·이름·뒤 4자리 + 순위마다 열 + 기타 열, 한 응답 = 한 줄", () => {
    const cols = surveyCsvColumns(DEMAND_2027);
    expect(cols.slice(0, 3)).toEqual(["응답 일시", "이름", "휴대폰 뒤 4자리"]);
    expect(cols).toContain("관심 분야(1·2순위) · 1순위"); expect(cols).toContain("관심 분야(1·2순위) · 2순위"); expect(cols).toContain("중요 요소 · 기타 입력");
    const row: SurveyResponseRow = { id: "r-1", survey_id: "s-1", answers: { ...good, factors: ["참여비", OTHER], factorsOther: "=주차" }, name: "김라움", phone_last4: "1234", consent_at: "2026-11-18T01:00:00Z", created_at: "2026-11-18T01:00:00Z" };
    const lines = surveyCsv(DEMAND_2027, [row]).replace(/^﻿/, "").split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"2026-11-18T10:00:00+09:00"');
    expect(lines[1]).toContain('"=""1234"""');
    expect(lines[1]).toContain('"\'=주차"'); // 수식 시작 글자 방어
    expect(lines[1]).toContain('"참여비, 기타"');
  });
});

describe("POST /api/survey", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.survey_responses = []; db.tables.surveys = [survey()]; });
  it("모르는 토큰·마감·기간 종료는 403, 저장 없음", async () => {
    const { POST } = await import("@/app/api/survey/route");
    expect((await POST(post({ token: "x".repeat(22), answers: good }))).status).toBe(403);
    db.tables.surveys = [survey({ closed_at: new Date().toISOString() })];
    const r = await POST(post({ answers: good }));
    expect(r.status).toBe(403); expect((await r.json()).message).toBe(SURVEY_MESSAGE.closed);
    db.tables.surveys = [survey({ closes_at: "2020-01-01T00:00:00Z" })];
    expect((await POST(post({ answers: good }))).status).toBe(403);
    expect(db.tables.survey_responses).toHaveLength(0);
  });
  it("답이 모자라면 400 · 뒤 4자리 형식 · 이름을 적으면 동의 필수", async () => {
    const { POST } = await import("@/app/api/survey/route");
    expect((await POST(post({ answers: { ...good, interest: ["TASTE TABLE"] } }))).status).toBe(400);
    expect((await POST(post({ answers: good, phone4: "12a4", consent: true }))).status).toBe(400);
    const r = await POST(post({ answers: good, name: "김라움" }));
    expect(r.status).toBe(400); expect((await r.json()).message).toContain("동의");
    expect(db.tables.survey_responses).toHaveLength(0);
  });
  it("무기명 제출은 동의 없이 저장(이름·뒤 4자리 null), 이름+동의는 동의 시각·버전 기록, 설문의 최근 응답 시각 갱신", async () => {
    const { POST } = await import("@/app/api/survey/route");
    expect((await POST(post({ answers: { ...good, hacked: "x" } }))).status).toBe(200);
    const r1 = db.tables.survey_responses[0] as Record<string, unknown>;
    expect(r1).toMatchObject({ survey_id: "s-1", name: null, phone_last4: null, consent_at: null });
    expect((r1.answers as Record<string, unknown>).hacked).toBeUndefined();
    expect((await POST(post({ answers: good, name: " 김라움 ", phone4: "1234", consent: true }))).status).toBe(200);
    const r2 = db.tables.survey_responses[1] as Record<string, unknown>;
    expect(r2).toMatchObject({ name: "김라움", phone_last4: "1234", consent_version: "2026-11-18" });
    expect(r2.consent_at).toBeTruthy();
    expect((db.tables.surveys[0] as { last_response_at: string | null }).last_response_at).toBeTruthy();
  });
});

describe("관리자 API", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.surveys = []; me = { id: "11111111-1111-4111-8111-111111111111", role: "owner" }; });
  const create = (body: unknown) => new Request("https://test.example/api/admin/surveys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  it("만들기: 관리자만, 이름 필수, 모르는 종류 거부, 마감일(일수)·없음, 응답에 /s/ 주소", async () => {
    const { POST } = await import("@/app/api/admin/surveys/route");
    me = null; expect((await POST(create({ name: "x" }))).status).toBe(403);
    me = { id: "a", role: "admin" };
    expect((await POST(create({ name: "" }))).status).toBe(400);
    expect((await POST(create({ name: "x", kind: "nope" }))).status).toBe(400);
    const res = await POST(create({ name: "11월 발송", days: 14 }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { survey: { token: string; url: string; closesAt: string | null } };
    expect(j.survey.url.endsWith(`/s/${j.survey.token}`)).toBe(true);
    expect((new Date(j.survey.closesAt!).getTime() - Date.now()) / 86_400_000).toBeGreaterThan(13.9);
    const res2 = await POST(create({ name: "무기한", days: null }));
    expect(((await res2.json()) as { survey: { closesAt: string | null } }).survey.closesAt).toBeNull();
    expect((db.tables.surveys[0] as Record<string, unknown>).kind).toBe("demand2027");
  });
  it("마감·다시 열기: 다시 열면 마감일도 지운다, 없는 id 는 404", async () => {
    const { PATCH } = await import("@/app/api/admin/surveys/[id]/route");
    db.tables.surveys = [survey({ closes_at: "2020-01-01T00:00:00Z" })];
    const patch = (id: string, body: unknown) => PATCH(new Request(`https://test.example/api/admin/surveys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
    expect((await patch("s-1", { closed: true })).status).toBe(200);
    expect((db.tables.surveys[0] as { closed_at: string | null }).closed_at).toBeTruthy();
    expect((await patch("s-1", { closed: false })).status).toBe(200);
    expect(db.tables.surveys[0]).toMatchObject({ closed_at: null, closes_at: null });
    expect((await patch("s-1", {})).status).toBe(400);
    expect((await patch("nope", { closed: true })).status).toBe(404);
  });
  it("CSV 는 주관리자만", async () => {
    const { GET } = await import("@/app/api/admin/surveys/[id]/export/route");
    db.tables.surveys = [survey()]; db.tables.survey_responses = [{ id: "r-1", survey_id: "s-1", answers: good, name: null, phone_last4: null, consent_at: null, created_at: new Date().toISOString() }];
    const get = (id: string) => GET(new Request(`https://test.example/api/admin/surveys/${id}/export`), { params: Promise.resolve({ id }) });
    me = { id: "a", role: "admin" }; expect((await get("s-1")).status).toBe(403);
    me = { id: "o", role: "owner" };
    const r = await get("s-1");
    expect(r.status).toBe(200); expect(r.headers.get("Content-Type")).toContain("text/csv");
    expect((await r.text()).split("\r\n")).toHaveLength(2);
  });
});
