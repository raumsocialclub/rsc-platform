import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { applyHref, applyState, canApply, cleanEventSlug, fillEvent, kstToday } from "@/lib/posts/apply";
import { entryLabel, eventsOf, latestEvent } from "@/lib/inquiries/track";
import { joinSourceLabel, matchesJoin, profileCard } from "@/lib/inquiries/join";
import type { InquiryRow } from "@/components/admin/InquiryDetail";

/** 소식 「참여하기」 (M24): 버튼 링크 · 빠른 신청 API · 설문 제출에 행사 기록 · 어드민 표시. 전부 가상 데이터 */
const db = fakeDb();
vi.mock("@/lib/supabase/admin", () => ({
  hasServiceRoleKey: () => true,
  createAdminClient: () => ({ ...db.client, storage: { from: () => ({ list: async () => ({ data: [], error: null }) }) } }),
}));

const POSTS = [
  { id: "p1", slug: "11월-라움소셜나이트", title: "11월 Raum Social Night 🍷", published: true, apply_open: true, event_date: "2999-12-31" },
  { id: "p2", slug: "공지", title: "휴무 공지", published: true, apply_open: false, event_date: null },
  { id: "p3", slug: "초안", title: "초안 글", published: false, apply_open: true, event_date: null },
  { id: "p4", slug: "지난-모닝", title: "10월 Raum Social Morning", published: true, apply_open: true, event_date: "2020-01-01" },
];
const req = (url: string, body: unknown) => new Request(`https://test.example${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const base = { name: "김라움", gender: "여성", birth: "1990.05.20", marital: "미혼", homeSido: "서울특별시", phone: "01012345678" };
const row = (answers: Record<string, unknown>, extra: Partial<InquiryRow> = {}): InquiryRow => ({ id: "i1", name: "김라움", phone: "010-1234-5678", email: null, result_type: null, status: "pending", memo: null, created_at: "2026-11-25T01:00:00Z", answers: answers as InquiryRow["answers"], ...extra });

describe("참여하기 링크·판정", () => {
  it("버튼 링크는 사전등록 설문 + event=글 주소, 발행 중이고 apply_open 이 꺼지지 않은 글만 버튼", () => {
    expect(applyHref("11월-라움소셜나이트")).toBe(`/match-check?src=prereg&event=${encodeURIComponent("11월-라움소셜나이트")}`);
    expect(canApply({ published: true, apply_open: true })).toBe(true);
    expect(canApply({ published: true, apply_open: undefined })).toBe(true); // 옛 행(컬럼 추가 전)도 켬
    expect(canApply({ published: true, apply_open: false })).toBe(false);
    expect(canApply({ published: false, apply_open: true })).toBe(false);
    // 행사 일자가 오늘(KST)보다 전이면 참여 종료, 당일·미래·없음은 열림
    expect(applyState({ published: true, apply_open: true, event_date: "2020-01-01" })).toBe("closed");
    expect(applyState({ published: true, apply_open: true, event_date: kstToday() })).toBe("open");
    expect(applyState({ published: true, apply_open: true, event_date: null })).toBe("open");
    expect(applyState({ published: true, apply_open: false, event_date: "2020-01-01" })).toBe("off");
    expect(applyState({ published: true, apply_open: true, event_date: "2026-11-24" }, "2026-11-25")).toBe("closed");
    expect(applyState({ published: true, apply_open: true, event_date: "2026-11-25" }, "2026-11-25")).toBe("open");
    expect(cleanEventSlug("11월-라움소셜나이트")).toBe("11월-라움소셜나이트");
    expect(cleanEventSlug("a b")).toBe("");
    expect(cleanEventSlug("x".repeat(121))).toBe("");
    expect(fillEvent("「{event}」 참여 신청", "11월 나이트")).toBe("「11월 나이트」 참여 신청");
  });
});

describe("어드민 표시", () => {
  const evs = [{ slug: "a", title: "10월 모닝", at: "2026-10-01T00:00:00Z" }, { slug: "b", title: "11월 나이트", at: "2026-11-01T00:00:00Z" }];
  it("참여 신청 행사 목록·최신 행사·들어온 경로·가입 신청 배지·검색·프로필 카드", () => {
    const r = row({ form: "match", entrySource: "prereg", entryPath: "/news", inviteCode: "RSC-1" }, { events: evs });
    expect(eventsOf(r)).toHaveLength(2);
    expect(latestEvent(r)?.title).toBe("11월 나이트");
    expect(entryLabel(r)).toBe("소식 · 「11월 나이트」 참여하기 버튼");
    expect(joinSourceLabel(r)).toBe("참여 신청 · 11월 나이트 외 1건 · 초대코드 RSC-1");
    expect(joinSourceLabel(row({ form: "match" }, { events: [evs[1]] }))).toBe("참여 신청 · 11월 나이트");
    expect(joinSourceLabel(row({ form: "match", entrySource: "prereg" }))).toBe("사전등록");
    expect(matchesJoin(r, "", "나이트")).toBe(true);
    expect(matchesJoin(r, "", "없는행사")).toBe(false);
    const card = profileCard(row({ form: "match", match: { gender: "여성", birth: "1990-05-20" } }, { events: [{ ...evs[0], status: "confirmed" }, evs[1]] }));
    const info = card.sections.find((s) => s.title === "접수 정보")!;
    const evRows = info.rows.filter((x) => x.label === "참여 신청 행사");
    expect(evRows.map((x) => x.value.split(" · ")[0])).toEqual(["10월 모닝", "11월 나이트"]);
    expect(evRows[0].value).toContain("참석 확정");
    // 잘못된 값은 무시
    expect(eventsOf({ events: [{ slug: 1 } as never, null as never] })).toEqual([]);
    expect(eventsOf(row({ form: "match" }))).toEqual([]);
  });
});

describe("POST /api/events/apply — 이미 설문을 낸 사람의 빠른 참여 신청", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.posts = POSTS.map((p) => ({ ...p })); db.tables.inquiries = []; db.tables.event_applications = []; });
  it("번호가 없으면 found:false(설문으로), 참여 안 받는 글·발행 전 글·없는 글·잘못된 번호는 400, 지난 행사는 마감 안내 400", async () => {
    const { POST, APPLY_CLOSED_MESSAGE } = await import("@/app/api/events/apply/route");
    const r1 = await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "010-9999-0000" }));
    expect(r1.status).toBe(200);
    expect(await r1.json()).toEqual({ ok: true, found: false });
    expect((await POST(req("/api/events/apply", { event: "공지", phone: "010-1234-5678" }))).status).toBe(400);
    expect((await POST(req("/api/events/apply", { event: "초안", phone: "010-1234-5678" }))).status).toBe(400);
    expect((await POST(req("/api/events/apply", { event: "없는글", phone: "010-1234-5678" }))).status).toBe(400);
    expect((await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "123" }))).status).toBe(400);
    const closed = await POST(req("/api/events/apply", { event: "지난-모닝", phone: "010-1234-5678" }));
    expect(closed.status).toBe(400);
    expect((await closed.json()).message).toBe(APPLY_CLOSED_MESSAGE);
    expect(db.calls).toHaveLength(0);
  });
  it("같은 번호의 가장 최근 프로필 설문 행으로 event_applications 한 건(source=quick), 같은 소식은 already:true. 상담 신청(fit-check) 행은 대상이 아니다", async () => {
    const { POST } = await import("@/app/api/events/apply/route");
    db.tables.inquiries = [
      { id: "old", phone: "010-1234-5678", created_at: "2026-10-01T00:00:00Z", answers: { form: "match" } },
      { id: "fit", phone: "010-1234-5678", created_at: "2026-11-02T00:00:00Z", answers: { form: undefined, track: "social" } },
      { id: "new", phone: "010-1234-5678", created_at: "2026-11-01T00:00:00Z", answers: { form: "match", entrySource: "prereg" } },
    ];
    const r = await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "01012345678" }));
    expect(await r.json()).toEqual({ ok: true, found: true, already: false });
    expect(db.tables.event_applications).toHaveLength(1);
    expect(db.tables.event_applications[0]).toMatchObject({ post_id: "p1", inquiry_id: "new", source: "quick" });
    const r2 = await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "010-1234-5678" }));
    expect(await r2.json()).toEqual({ ok: true, found: true, already: true });
    expect(db.tables.event_applications).toHaveLength(1);
  });
});

describe("POST /api/match — 설문 제출에 참여 신청 기록", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.posts = POSTS.map((p) => ({ ...p })); db.tables.inquiries = []; db.tables.event_applications = []; db.tables.marketing_consents = []; });
  it("event 가 있으면 저장 뒤 event_applications 한 건(source=survey)이 생기고 entrySource 는 prereg 로 채워진다", async () => {
    const { POST } = await import("@/app/api/match/route");
    const res = await POST(req("/api/match", { answers: base, consent: true, event: "11월-라움소셜나이트" }));
    expect(res.status).toBe(200);
    const inq = db.tables.inquiries[0] as { id: string; answers: Record<string, unknown> };
    expect(inq.answers.entrySource).toBe("prereg");
    expect(inq.answers.events).toBeUndefined();
    expect(db.tables.event_applications).toEqual([expect.objectContaining({ post_id: "p1", inquiry_id: inq.id, source: "survey" })]);
  });
  it("참여 안 받는 글·없는 글·지난 행사는 400 — 저장 없음. event 없이는 참여 신청도 없다", async () => {
    const { POST } = await import("@/app/api/match/route");
    expect((await POST(req("/api/match", { answers: base, consent: true, event: "공지" }))).status).toBe(400);
    expect((await POST(req("/api/match", { answers: base, consent: true, event: "없는글" }))).status).toBe(400);
    expect((await POST(req("/api/match", { answers: base, consent: true, event: "지난-모닝" }))).status).toBe(400);
    expect(db.tables.inquiries).toHaveLength(0);
    expect((await POST(req("/api/match", { answers: base, consent: true }))).status).toBe(200);
    expect(db.tables.event_applications).toHaveLength(0);
  });
});
