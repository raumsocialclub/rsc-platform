import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { PopupInputSchema } from "@/lib/popups/schema";
import { popupState, POPUP_RATIOS } from "@/lib/popups/types";

/** 홈 팝업 (M17): 입력 검증 · 노출 판정 · 어드민 API. 가상 데이터 */
const db = fakeDb();
let me: { id: string; role: string } | null = { id: "admin-1", role: "admin" };
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));
vi.mock("@/lib/admin/log", () => ({ logAdmin: async () => {} }));
const revalidated: string[] = [];
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => { revalidated.push(p); } }));

const IMG = "https://example.supabase.co/storage/v1/object/public/site/2026-10-21/a.jpg";
const valid = { title: "10월 오픈", image_url: IMG, ratio: "4:5", link_url: "/news/open", starts_at: "2026-10-21", ends_at: "2026-10-31", active: true, sort_order: 1 };
const ID = "44444444-4444-4444-8444-444444444444";
const req = (url: string, method: string, body?: unknown) => new Request(`https://test.example${url}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("팝업 입력 검증", () => {
  it("비율은 1:1 (1000×1000) · 4:5 (1080×1350) 두 가지", () => {
    expect(POPUP_RATIOS["1:1"]).toMatchObject({ w: 1000, h: 1000 });
    expect(POPUP_RATIOS["4:5"]).toMatchObject({ w: 1080, h: 1350 });
    expect(PopupInputSchema.safeParse({ ...valid, ratio: "16:9" }).success).toBe(false);
  });
  it("이미지 없음·잘못된 링크·날짜 역전은 거부, 링크·기간은 비워도 된다", () => {
    expect(PopupInputSchema.safeParse({ ...valid, image_url: "" }).success).toBe(false);
    expect(PopupInputSchema.safeParse({ ...valid, link_url: "javascript:alert(1)" }).success).toBe(false);
    expect(PopupInputSchema.safeParse({ ...valid, link_url: "www.example.com" }).success).toBe(false);
    expect(PopupInputSchema.safeParse({ ...valid, starts_at: "2026-11-01", ends_at: "2026-10-01" }).success).toBe(false);
    expect(PopupInputSchema.safeParse({ ...valid, link_url: "", starts_at: "", ends_at: "" }).success).toBe(true);
    expect(PopupInputSchema.safeParse({ ...valid, link_url: "https://instagram.com/raum" }).success).toBe(true);
  });
});

describe("노출 판정", () => {
  const now = new Date("2026-10-21T03:00:00.000Z");
  it("켜짐 + 기간 안 = 노출 중, 시작 전 = 예약됨, 종료 후 = 종료, 꺼짐 = 꺼짐", () => {
    expect(popupState({ active: true, starts_at: null, ends_at: null }, now)).toBe("live");
    expect(popupState({ active: true, starts_at: "2026-10-20T15:00:00.000Z", ends_at: "2026-10-31T14:59:59.000Z" }, now)).toBe("live");
    expect(popupState({ active: true, starts_at: "2026-10-22T15:00:00.000Z", ends_at: null }, now)).toBe("scheduled");
    expect(popupState({ active: true, starts_at: null, ends_at: "2026-10-20T14:59:59.000Z" }, now)).toBe("ended");
    expect(popupState({ active: false, starts_at: null, ends_at: null }, now)).toBe("off");
  });
});

describe("어드민 팝업 API", () => {
  beforeEach(() => {
    db.tables.popups = [];
    db.calls.length = 0;
    revalidated.length = 0;
    me = { id: "admin-1", role: "admin" };
  });
  it("관리자가 아니면 403", async () => {
    me = null;
    const { POST } = await import("@/app/api/admin/popups/route");
    expect((await POST(req("/api/admin/popups", "POST", valid))).status).toBe(403);
  });
  it("등록: 기간은 한국 시간 하루 단위로 저장하고 홈 캐시를 갱신한다", async () => {
    const { POST } = await import("@/app/api/admin/popups/route");
    const res = await POST(req("/api/admin/popups", "POST", valid));
    expect(res.status).toBe(200);
    const row = db.tables.popups[0] as Record<string, unknown>;
    expect(row).toMatchObject({ title: "10월 오픈", ratio: "4:5", link_url: "/news/open", active: true, sort_order: 1, created_by: "admin-1" });
    expect(row.starts_at).toBe("2026-10-20T15:00:00.000Z");
    expect(row.ends_at).toBe("2026-10-31T14:59:59.000Z");
    expect(revalidated).toContain("/");
  });
  it("잘못된 입력은 400 이고 저장하지 않는다", async () => {
    const { POST } = await import("@/app/api/admin/popups/route");
    expect((await POST(req("/api/admin/popups", "POST", { ...valid, title: "" }))).status).toBe(400);
    expect(db.tables.popups).toHaveLength(0);
  });
  it("수정 · 켜기/끄기 · 삭제", async () => {
    db.tables.popups = [{ id: ID, ...valid, link_url: null, starts_at: null, ends_at: null }];
    const { PUT, PATCH, DELETE } = await import("@/app/api/admin/popups/[id]/route");
    expect((await PUT(req(`/api/admin/popups/${ID}`, "PUT", { ...valid, title: "바뀐 이름", ratio: "1:1" }), ctx(ID))).status).toBe(200);
    expect(db.tables.popups[0]).toMatchObject({ title: "바뀐 이름", ratio: "1:1" });
    expect((await PATCH(req(`/api/admin/popups/${ID}`, "PATCH", { active: false }), ctx(ID))).status).toBe(200);
    expect(db.tables.popups[0]).toMatchObject({ active: false });
    expect((await PATCH(req(`/api/admin/popups/not-a-uuid`, "PATCH", { active: true }), ctx("not-a-uuid"))).status).toBe(400);
    expect((await DELETE(req(`/api/admin/popups/${ID}`, "DELETE"), ctx(ID))).status).toBe(200);
    expect(db.tables.popups).toHaveLength(0);
    expect((await DELETE(req(`/api/admin/popups/${ID}`, "DELETE"), ctx(ID))).status).toBe(404);
  });
});
