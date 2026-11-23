import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { JOIN_FILTERS, isJoinRequest, joinSourceLabel, joinState, matchAnswersOf, matchesJoin, parseJoinFilter, profileCard } from "@/lib/inquiries/join";

/** 가입 신청(2026-11-23): 프로필 진단 응답 = 가입 요청자, 승인 상태, 목록 필터, 프로필 카드. 전부 가상 데이터 */
const base = { id: "11111111-2222-3333-4444-555555555555", email: null, result_type: null, status: "pending", memo: null, created_at: "2026-11-23T01:00:00Z", utm: null } as const;
const prereg: InquiryRow & { approved_at?: string | null } = {
  ...base, name: "김라움", phone: "010-1234-5678",
  answers: {
    form: "match", entrySource: "prereg", entryPath: "/", photos: ["a/b.jpg", "a/c.jpg"], photo: "a/b.jpg", consentAt: "2026-11-23T01:00:00Z", consentVersion: "2026-11-20", marketing: true, marketingAt: "2026-11-23T01:00:00Z",
    match: { name: "김라움", gender: "여성", birth: "1990-05-10", marital: "미혼", children: "없음", homeSido: "서울특별시", homeGugun: "강남구", idealRegions: ["서울", "경기"], height: "165", weight: "52", education: "대학(4년제) 졸업", univName: "라움대학교", jobCategory: "전문직", jobDetail: "변호사", employment: "정규직", income: "8000", assets: "3억 ~ 5억", mbti: "ENFJ", smoking: "비흡연", drinking: "가끔 마셔요", priorities: ["대화 방식", "성격과 태도", "취향과 관심사"], source: "인스타그램" },
  },
};
const invite: InquiryRow & { approved_at?: string | null } = { ...base, id: "22222222-2222-3333-4444-555555555555", name: "박초대", phone: "010-9999-0000", answers: { form: "match", inviteCode: "RSC-AB12-CD34", match: { name: "박초대", gender: "남성", birth: "1988-01-01" } }, approved_at: "2026-11-23T02:00:00Z" };
const fit: InquiryRow = { ...base, id: "33333333-2222-3333-4444-555555555555", name: "이상담", phone: "010-0000-1111", answers: { route: "소셜클럽", track: "social" } };
const apply: InquiryRow = { ...base, id: "44444444-2222-3333-4444-555555555555", name: "최설문", phone: "010-2222-3333", answers: { form: "apply", apply: { gender: "남성" } } };

describe("가입 신청 분류", () => {
  it("프로필 진단 응답(사전등록·초대코드·직접 제출)만 가입 신청이고, 상담 신청·상담 전 설문은 아니다", () => {
    expect(isJoinRequest(prereg)).toBe(true);
    expect(isJoinRequest(invite)).toBe(true);
    expect(isJoinRequest({ answers: { form: "match" } })).toBe(true);
    expect(isJoinRequest(fit)).toBe(false);
    expect(isJoinRequest(apply)).toBe(false);
    expect(isJoinRequest({ answers: null })).toBe(false);
  });
  it("승인 상태는 approved_at 으로만 정해지고 상담 상태(status)와 무관하다", () => {
    expect(joinState(prereg)).toBe("pending");
    expect(joinState(invite)).toBe("approved");
    expect(joinState({ approved_at: null })).toBe("pending");
    expect(JOIN_FILTERS.map((f) => f.value)).toEqual(["", "pending", "approved"]);
    expect(parseJoinFilter("approved")).toBe("approved");
    expect(parseJoinFilter("x")).toBe("");
  });
  it("들어온 경로 배지: 사전등록 / 초대코드 / 프로필 진단", () => {
    expect(joinSourceLabel(prereg)).toBe("사전등록");
    expect(joinSourceLabel(invite)).toBe("초대코드 RSC-AB12-CD34");
    expect(joinSourceLabel({ answers: { form: "match", entrySource: "prereg", inviteCode: "RSC-1" } })).toBe("사전등록 · 초대코드 RSC-1");
    expect(joinSourceLabel({ answers: { form: "match" } })).toBe("프로필 진단");
  });
  it("목록 필터: 상태 + 이름·연락처(하이픈 무시)·초대코드 검색", () => {
    expect(matchesJoin(prereg, "", "")).toBe(true);
    expect(matchesJoin(prereg, "approved", "")).toBe(false);
    expect(matchesJoin(invite, "approved", "")).toBe(true);
    expect(matchesJoin(prereg, "", "01012345678")).toBe(true);
    expect(matchesJoin(prereg, "", "라움")).toBe(true);
    expect(matchesJoin(invite, "", "ab12")).toBe(true);
    expect(matchesJoin(prereg, "", "없는이름")).toBe(false);
    expect(matchesJoin({ ...fit, approved_at: null }, "", "")).toBe(false);
  });
});

describe("회원 프로필 카드", () => {
  it("설문 답을 섹션별로 정리하고 나이·사진 수·승인 상태를 함께 준다", () => {
    const c = profileCard(prereg);
    expect(c.name).toBe("김라움");
    expect(c.headline).toMatch(/^여성 · 만 \d+세 \(1990-05-10\)$/);
    expect(c.photos).toBe(2);
    expect(c.state).toBe("pending");
    const titles = c.sections.map((s) => s.title);
    expect(titles).toEqual(["기본 정보", "거주 · 활동", "학력 · 직업 · 경제", "생활", "만남에서 중요하게 생각하는 항목", "접수 정보"]);
    const find = (t: string, l: string) => c.sections.find((s) => s.title === t)!.rows.find((r) => r.label === l)?.value;
    expect(find("기본 정보", "키")).toBe("165cm");
    expect(find("거주 · 활동", "거주지역")).toBe("서울특별시 강남구");
    expect(find("거주 · 활동", "활동 가능 지역")).toBe("서울, 경기");
    expect(find("학력 · 직업 · 경제", "연 소득")).toBe("8,000만원");
    expect(find("만남에서 중요하게 생각하는 항목", "1순위")).toMatch(/^대화 방식 — /);
    expect(find("접수 정보", "들어온 경로")).toBe("메인 · 사전등록하기 버튼");
    expect(find("접수 정보", "마케팅 수신")).toMatch(/^동의/);
    expect(find("생활", "종교 (민감정보)")).toBeUndefined(); // 별도 동의 없이 저장되지 않은 항목은 빈 칸이 아니라 행이 없다
  });
  it("가입완료 회원·답이 적은 옛 응답도 카드가 만들어진다 (평탄화 목록에서 되살림)", () => {
    const c = profileCard(invite);
    expect(c.state).toBe("approved");
    expect(c.approvedAt).toBe("2026-11-23T02:00:00Z");
    expect(c.sections.find((s) => s.title === "접수 정보")!.rows.find((r) => r.label === "초대코드")?.value).toBe("RSC-AB12-CD34");
    const old = { ...base, name: "옛응답", phone: "010-1", answers: { form: "match", answers: [{ key: "gender", label: "성별", question: "성별", answer: "남성" }, { key: "homeSido", label: "거주지역", question: "", answer: "경기도" }] } } as InquiryRow;
    expect(matchAnswersOf(old)).toEqual({ gender: "남성", homeSido: "경기도" });
    expect(profileCard(old).sections.map((s) => s.title)).toEqual(["기본 정보", "거주 · 활동", "접수 정보"]);
    expect(profileCard(old).photos).toBe(0);
  });
});

describe("어드민 배선 (소스 확인)", () => {
  const src = (p: string) => readFileSync(p, "utf8");
  it("사이드바에 「가입 신청」 메뉴와 승인 대기 배지, 상담 신청 배지는 프로필 진단 제외", () => {
    const l = src("app/admin/layout.tsx");
    expect(l).toMatch(/href: "\/admin\/join", label: "가입 신청", badge: pendingJoin \?\? 0/);
    expect(l).toMatch(/\.eq\("answers->>form", "match"\)\.is\("approved_at", null\)/);
    expect(l).toMatch(/\.or\("answers->>form\.is\.null,answers->>form\.neq\.match"\)/);
  });
  it("상담 신청 목록은 프로필 진단 응답을 빼고, 가입 신청 페이지·프로필 카드·승인 API 가 있다", () => {
    expect(src("app/admin/inquiries/page.tsx")).toMatch(/\.filter\(\(r\) => !isJoinRequest\(r\)\)/);
    expect(src("app/admin/join/page.tsx")).toMatch(/\.eq\("answers->>form", "match"\)/);
    expect(src("app/admin/join/[id]/page.tsx")).toMatch(/<JoinProfileCard /);
    expect(src("app/api/admin/inquiries/[id]/approve/route.ts")).toMatch(/approved_at: approvedAt, approved_by: parsed\.data\.approve \? me\.id : null/);
    expect(src("components/admin/JoinApproveButton.tsx")).toMatch(/\/api\/admin\/inquiries\/\$\{id\}\/approve/);
    expect(src("SCHEMA.sql")).toMatch(/approved_at timestamptz/);
  });
});
