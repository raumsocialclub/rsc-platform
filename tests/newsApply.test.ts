import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { applyHref, canApply, cleanEventSlug, fillEvent } from "@/lib/posts/apply";
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
  { id: "p1", slug: "11월-라움소셜나이트", title: "11월 Raum Social Night 🍷", published: true, apply_open: true },
  { id: "p2", slug: "공지", title: "휴무 공지", published: true, apply_open: false },
  { id: "p3", slug: "초안", title: "초안 글", published: false, apply_open: true },
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
    expect(cleanEventSlug("11월-라움소셜나이트")).toBe("11월-라움소셜나이트");
    expect(cleanEventSlug("a b")).toBe("");
    expect(cleanEventSlug("x".repeat(121))).toBe("");
    expect(fillEvent("「{event}」 참여 신청", "11월 나이트")).toBe("「11월 나이트」 참여 신청");
  });
});

describe("어드민 표시", () => {
  const evs = [{ slug: "a", title: "10월 모닝", at: "2026-10-01T00:00:00Z" }, { slug: "b", title: "11월 나이트", at: "2026-11-01T00:00:00Z" }];
  it("참여 신청 행사 목록·최신 행사·들어온 경로·가입 신청 배지·검색·프로필 카드", () => {
    const r = row({ form: "match", entrySource: "prereg", entryPath: "/news", events: evs, inviteCode: "RSC-1" });
    expect(eventsOf(r)).toHaveLength(2);
    expect(latestEvent(r)?.title).toBe("11월 나이트");
    expect(entryLabel(r)).toBe("소식 · 「11월 나이트」 참여하기 버튼");
    expect(joinSourceLabel(r)).toBe("참여 신청 · 11월 나이트 외 1건 · 초대코드 RSC-1");
    expect(joinSourceLabel(row({ form: "match", events: [evs[1]] }))).toBe("참여 신청 · 11월 나이트");
    expect(joinSourceLabel(row({ form: "match", entrySource: "prereg" }))).toBe("사전등록");
    expect(matchesJoin(r, "", "나이트")).toBe(true);
    expect(matchesJoin(r, "", "없는행사")).toBe(false);
    const card = profileCard(row({ form: "match", events: evs, match: { gender: "여성", birth: "1990-05-20" } }));
    const info = card.sections.find((s) => s.title === "접수 정보")!;
    expect(info.rows.filter((x) => x.label === "참여 신청 행사").map((x) => x.value.split(" · ")[0])).toEqual(["10월 모닝", "11월 나이트"]);
    // 잘못된 값은 무시
    expect(eventsOf(row({ form: "match", events: [{ slug: 1 } as never, null as never] }))).toEqual([]);
  });
});

describe("POST /api/events/apply — 이미 설문을 낸 사람의 빠른 참여 신청", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.posts = POSTS.map((p) => ({ ...p })); db.tables.inquiries = []; });
  it("번호가 없으면 found:false(설문으로), 참여 안 받는 글·발행 전 글·잘못된 번호는 400", async () => {
    const { POST } = await import("@/app/api/events/apply/route");
    const r1 = await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "010-9999-0000" }));
    expect(r1.status).toBe(200);
    expect(await r1.json()).toEqual({ ok: true, found: false });
    expect((await POST(req("/api/events/apply", { event: "공지", phone: "010-1234-5678" }))).status).toBe(400);
    expect((await POST(req("/api/events/apply", { event: "초안", phone: "010-1234-5678" }))).status).toBe(400);
    expect((await POST(req("/api/events/apply", { event: "없는글", phone: "010-1234-5678" }))).status).toBe(400);
    expect((await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "123" }))).status).toBe(400);
    expect(db.calls).toHaveLength(0);
  });
  it("같은 번호의 가장 최근 프로필 설문 행에 events[] 를 붙이고, 같은 행사는 already:true. 상담 신청(fit-check) 행은 대상이 아니다", async () => {
    const { POST } = await import("@/app/api/events/apply/route");
    db.tables.inquiries = [
      { id: "old", phone: "010-1234-5678", created_at: "2026-10-01T00:00:00Z", answers: { form: "match", events: [{ slug: "a", title: "10월 모닝", at: "2026-10-01T00:00:00Z" }] } },
      { id: "fit", phone: "010-1234-5678", created_at: "2026-11-02T00:00:00Z", answers: { form: undefined, track: "social" } },
      { id: "new", phone: "010-1234-5678", created_at: "2026-11-01T00:00:00Z", answers: { form: "match", entrySource: "prereg" } },
    ];
    const r = await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "01012345678" }));
    expect(await r.json()).toEqual({ ok: true, found: true, already: false });
    const upd = db.calls.find((c) => c.op === "update")!;
    expect(upd.filters).toEqual([["eq", "id", "new"]]);
    const saved = (upd.payload as { answers: { events: { slug: string; title: string; at: string }[]; entrySource: string } }).answers;
    expect(saved.entrySource).toBe("prereg"); // 기존 answers 는 그대로 두고 events 만 붙는다
    expect(saved.events.map((e) => e.slug)).toEqual(["11월-라움소셜나이트"]);
    expect(saved.events[0].title).toBe("11월 Raum Social Night 🍷");
    const r2 = await POST(req("/api/events/apply", { event: "11월-라움소셜나이트", phone: "010-1234-5678" }));
    expect(await r2.json()).toEqual({ ok: true, found: true, already: true });
    expect(db.calls.filter((c) => c.op === "update")).toHaveLength(1);
  });
});

describe("POST /api/match — 설문 제출에 참여 행사 기록", () => {
  beforeEach(() => { db.calls.length = 0; db.tables.posts = POSTS.map((p) => ({ ...p })); db.tables.inquiries = []; db.tables.marketing_consents = []; });
  it("event 가 있으면 answers.events[] 에 제목·시각이 남고 entrySource 는 prereg 로 채워진다", async () => {
    const { POST } = await import("@/app/api/match/route");
    const res = await POST(req("/api/match", { answers: base, consent: true, event: "11월-라움소셜나이트" }));
    expect(res.status).toBe(200);
    const a = (db.tables.inquiries[0] as { answers: Record<string, unknown> }).answers;
    expect(a.entrySource).toBe("prereg");
    expect(a.events).toEqual([{ slug: "11월-라움소셜나이트", title: "11월 Raum Social Night 🍷", at: expect.any(String) }]);
  });
  it("참여 안 받는 글·없는 글은 400 — 저장 없음. event 없이는 events 도 없다", async () => {
    const { POST } = await import("@/app/api/match/route");
    expect((await POST(req("/api/match", { answers: base, consent: true, event: "공지" }))).status).toBe(400);
    expect((await POST(req("/api/match", { answers: base, consent: true, event: "없는글" }))).status).toBe(400);
    expect(db.tables.inquiries).toHaveLength(0);
    expect((await POST(req("/api/match", { answers: base, consent: true }))).status).toBe(200);
    expect((db.tables.inquiries[0] as { answers: Record<string, unknown> }).answers.events).toBeUndefined();
  });
});
