import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { MARITAL_OPTIONS, PRIORITY_OPTIONS, QUESTIONS, REQUIRED_KEYS, SENSITIVE_KEYS, ageOf, flattenMatchAnswers, formatBirthInput, isBlockedAnswer, missingMatchRequired, parseBirth, questionTitle, sanitizeMatchAnswers } from "@/lib/match/schema";
import { isPhotoPath, photoPathFor, photoProblem } from "@/lib/match/photo";

/** 프로필 진단(/match-check, 1:1 매칭 DB 수집): 문항 정의 · 정제 · 저장. 전부 가상 데이터 */
const db = fakeDb();
const storageList = vi.fn(async () => ({ data: [{ name: "photo.jpg", metadata: { size: 1234 } }], error: null }));
vi.mock("@/lib/supabase/admin", () => ({
  hasServiceRoleKey: () => true,
  createAdminClient: () => ({ ...db.client, storage: { from: () => ({ list: storageList }) } }),
}));

const post = (body: Record<string, unknown>) => new Request("https://test.example/api/match", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const base = { name: "김라움", gender: "여성", birth: "1990.05.20", marital: "미혼", homeSido: "서울특별시", phone: "01012345678" };
const PHOTO = "inbox/123e4567-e89b-12d3-a456-426614174000/photo.jpg";

describe("문항 정의", () => {
  it("키는 겹치지 않고, 필수는 이름·성별·생년월일·혼인 상태·거주 시/도·휴대폰, 민감정보는 종교·건강, 마지막은 휴대폰", () => {
    const keys = QUESTIONS.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(REQUIRED_KEYS).toEqual(["name", "gender", "birth", "marital", "homeSido", "phone"]);
    expect(SENSITIVE_KEYS).toEqual(["religion", "health"]);
    expect(QUESTIONS[QUESTIONS.length - 1].key).toBe("phone");
    expect(QUESTIONS.find((q) => q.key === "priorities")?.exact).toBe(3);
  });
  it("2026-11-18 수정: 혼인 상태 미혼·돌싱·기혼(기혼은 진행 불가), 부모님 자산·중요 요소 상세 삭제, 활동 가능 지역 + 시/군/구, 중요 항목 14개(설명), 사진 3장, 마지막 안내 화면 뒤 휴대폰", () => {
    expect(MARITAL_OPTIONS).toEqual(["미혼", "돌싱", "기혼"]);
    const marital = QUESTIONS.find((q) => q.key === "marital")!;
    expect(isBlockedAnswer(marital, "기혼")).toBe(true); expect(isBlockedAnswer(marital, "미혼")).toBe(false);
    expect(missingMatchRequired({ ...base, marital: "기혼" })?.key).toBe("marital");
    const keys = QUESTIONS.map((q) => q.key);
    expect(keys).not.toContain("parentsAsset"); expect(keys).not.toContain("priorityDetail");
    expect(keys.indexOf("idealGugun")).toBe(keys.indexOf("idealRegions") + 1);
    expect(QUESTIONS.find((q) => q.key === "idealRegions")?.title).toBe("활동 가능한 지역을 선택해주세요.");
    expect(QUESTIONS.find((q) => q.key === "homeSido")?.sub).toBeUndefined();
    expect(PRIORITY_OPTIONS).toHaveLength(14); expect(PRIORITY_OPTIONS[0]).toBe("첫인상과 스타일"); expect(PRIORITY_OPTIONS[13]).toBe("관계에 대한 생각");
    const pr = QUESTIONS.find((q) => q.key === "priorities")!;
    expect(pr.layout).toBe("list"); expect(pr.optionDesc?.["키"]).toContain("선호하는 범위");
    expect(QUESTIONS.find((q) => q.key === "photo")?.max).toBe(3);
    expect(keys.slice(-3)).toEqual(["photo", "docs", "phone"]);
    const docs = QUESTIONS.find((q) => q.key === "docs")!;
    expect(docs.type).toBe("info"); expect(docs.table?.rows.map((r) => r[1])).toEqual(["혼인관계증명서", "재직증명서", "소득금액증명원"]);
  });
  it("생년월일: 서식·검증·만 나이", () => {
    expect(formatBirthInput("19900520")).toBe("1990.05.20");
    expect(formatBirthInput("1990")).toBe("1990");
    expect(parseBirth("1990.05.20")).toBe("1990-05-20");
    expect(parseBirth("1990.02.30")).toBeNull();
    expect(parseBirth("1930-01-01")).toBeNull();
    expect(ageOf("1990.05.20", new Date("2026-05-19T00:00:00Z"))).toBe(35);
    expect(ageOf("1990.05.20", new Date("2026-05-20T12:00:00Z"))).toBe(36);
  });
  it("제목 치환: {name}", () => {
    const photo = QUESTIONS.find((q) => q.key === "photo")!;
    expect(questionTitle(photo, { name: "김라움" })).toBe("김라움 님의 사진을 올려주세요.");
    expect(questionTitle(photo, {})).toContain("회원 님");
  });
});

describe("정제·평탄화", () => {
  it("선택지 밖의 값·모르는 키·잘못된 숫자/날짜는 버리고, 3개가 아닌 중요 요소는 버린다", () => {
    const a = sanitizeMatchAnswers({ ...base, hacked: "x", gender: "외계인", height: "abc", weight: "60", birth: "1990/13/01", priorities: ["키", "나이"], idealGugun: "강남구", idealRegions: ["서울", "화성"], mbti: "INTJ", health: "a".repeat(600), photo: "inbox/x/photo.jpg" });
    expect(a.hacked).toBeUndefined();
    expect(a.gender).toBeUndefined();
    expect(a.height).toBeUndefined();
    expect(a.weight).toBe("60");
    expect(a.birth).toBeUndefined();
    expect(a.priorities).toBeUndefined();
    expect(a.idealGugun).toBe("강남구");
    expect(a.idealRegions).toEqual(["서울"]);
    expect(a.mbti).toBe("INTJ");
    expect((a.health as string).length).toBe(500);
    expect(a.photo).toBeUndefined();
    expect(sanitizeMatchAnswers({ ...base, priorities: ["키", "나이", "생활권과 거리"] }).priorities).toEqual(["키", "나이", "생활권과 거리"]);
    expect(sanitizeMatchAnswers({ ...base, priorities: ["키", "나이", "거리"] }).priorities).toBeUndefined(); // 옛 선택지는 버린다
  });
  it("필수가 비면 그 문항, 평탄화는 이름·휴대폰·사진을 빼고 순서대로(단위·만 나이 포함)", () => {
    expect(missingMatchRequired(sanitizeMatchAnswers({ name: "김", gender: "여성" }))?.key).toBe("birth");
    expect(missingMatchRequired(sanitizeMatchAnswers(base))).toBeNull();
    const rows = flattenMatchAnswers(sanitizeMatchAnswers({ ...base, height: "165", income: "6000", source: "유튜브" }));
    expect(rows.map((r) => r.key)).toEqual(["gender", "birth", "marital", "homeSido", "height", "income", "source"]);
    expect(rows[1].answer).toMatch(/^1990-05-20 \(만 \d+세\)$/);
    expect(rows[4].answer).toBe("165cm");
    expect(rows[5].answer).toBe("6,000만원");
  });
  it("사진 규칙: 확장자·크기·경로", () => {
    expect(photoProblem("a.jpg", 100)).toBeNull();
    expect(photoProblem("a.heic", 100)).toBeNull();
    expect(photoProblem("a.pdf", 100)).toMatch(/사진만/);
    expect(photoProblem("a.png", 11 * 1024 * 1024)).toMatch(/10MB/);
    expect(isPhotoPath(photoPathFor("x.PNG"))).toBe(true);
    expect(isPhotoPath("inbox/../photo.jpg")).toBe(false);
    expect(isPhotoPath("inbox/123e4567-e89b-12d3-a456-426614174000/photo.pdf")).toBe(false);
  });
});

describe("POST /api/match", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.inquiries = []; db.tables.marketing_consents = []; storageList.mockClear(); });
  it("동의 없으면 400, 필수 없으면 400, 휴대폰 형식 틀리면 400 — 저장 없음", async () => {
    const { POST } = await import("@/app/api/match/route");
    expect((await POST(post({ answers: base, consent: false }))).status).toBe(400);
    expect((await POST(post({ answers: { ...base, marital: "" }, consent: true }))).status).toBe(400);
    expect((await POST(post({ answers: { ...base, phone: "123" }, consent: true }))).status).toBe(400);
    expect(db.tables.inquiries).toHaveLength(0);
  });
  it("저장: 이름·휴대폰은 컬럼, form=match · track=matching · 직업/학력/거주지 · answers[] · 원본. 민감정보는 동의 없으면 버림, 사진 없음", async () => {
    const { POST } = await import("@/app/api/match/route");
    const res = await POST(post({ answers: { ...base, jobCategory: "전문직", education: "대학(4년제) 졸업", homeGugun: "강남구", religion: "불교", health: "없음", source: "인스타그램", priorities: ["키", "나이", "생활권과 거리"] }, consent: true, marketing: false, entryPath: "/matching", utm: { utm_source: "ig" } }));
    expect(res.status).toBe(200);
    const row = db.tables.inquiries[0] as { name: string; phone: string; answers: Record<string, unknown>; utm: unknown };
    expect(row.name).toBe("김라움");
    expect(row.phone).toBe("010-1234-5678");
    expect(row.answers).toMatchObject({ form: "match", track: "matching", entryTrack: "matching", entryPath: "/matching", job: "전문직", education: "대학(4년제) 졸업", region: "서울특별시", district: "강남구", source: "인스타그램", marketing: false, consentVersion: expect.any(String) });
    expect(row.answers.religion).toBeUndefined();
    expect(row.answers.photo).toBeUndefined();
    expect(row.answers.sensitiveConsentAt).toBeUndefined();
    const match = row.answers.match as Record<string, unknown>;
    expect(match.religion).toBeUndefined();
    expect(match.health).toBeUndefined();
    expect(match.priorities).toEqual(["키", "나이", "생활권과 거리"]);
    const list = row.answers.answers as { key: string }[];
    expect(list.map((r) => r.key)).not.toContain("religion");
    expect(list.map((r) => r.key)).toContain("priorities");
    expect(row.utm).toEqual({ utm_source: "ig" });
    expect(storageList).not.toHaveBeenCalled();
  });
  it("민감정보 동의 + 사진 + 마케팅 동의: 종교 저장, 사진 경로 확인 후 기록, marketing_consents 추가", async () => {
    const { POST } = await import("@/app/api/match/route");
    const PHOTO2 = "inbox/223e4567-e89b-12d3-a456-426614174000/photo.jpg";
    const res = await POST(post({ answers: { ...base, religion: "불교" }, consent: true, sensitiveConsent: true, marketing: true, photos: [PHOTO, PHOTO2, PHOTO] }));
    expect(res.status).toBe(200);
    const row = db.tables.inquiries[0] as { answers: Record<string, unknown> };
    expect(row.answers.photo).toBe(PHOTO);
    expect(row.answers.photos).toEqual([PHOTO, PHOTO2]); // 중복은 한 번만
    expect(row.answers.sensitiveConsentAt).toEqual(expect.any(String));
    expect((row.answers.match as Record<string, unknown>).religion).toBe("불교");
    expect(storageList).toHaveBeenCalledWith("inbox/123e4567-e89b-12d3-a456-426614174000", { limit: 5 });
    expect(db.tables.marketing_consents).toHaveLength(1);
    expect(db.tables.marketing_consents[0]).toMatchObject({ name: "김라움", phone: "010-1234-5678", region: "서울특별시", track: "matching" });
  });
  it("버킷에 없는 사진 경로·이상한 경로는 400", async () => {
    const { POST } = await import("@/app/api/match/route");
    expect((await POST(post({ answers: base, consent: true, photo: "inbox/../etc/passwd" }))).status).toBe(400);
    storageList.mockResolvedValueOnce({ data: [], error: null });
    expect((await POST(post({ answers: base, consent: true, photo: PHOTO }))).status).toBe(400);
    expect((await POST(post({ answers: base, consent: true, photos: [PHOTO, PHOTO, PHOTO, PHOTO] }))).status).toBe(400); // 3장 초과
    expect(db.tables.inquiries).toHaveLength(0);
  });
});
