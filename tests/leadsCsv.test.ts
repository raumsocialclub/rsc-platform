import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { LEAD_COLUMNS, leadsCsv, matchesUtmFilter, toKstIso, toLeadPhone, toLeadRow } from "@/lib/admin/leads";

/** 상담 신청 → 메타 리드 CSV 양식 (가상 데이터) */
const db = fakeDb();
let me: { id: string; role: string } | null = { id: "admin-1", role: "admin" };
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));

const paid = { id: "inq-1", name: "홍길동", phone: "010-1234-5678", created_at: "2026-10-20T05:32:11.000Z", utm: { utm_source: "ig", utm_medium: "paid", utm_campaign: "120212345678901234", utm_term: "120298765432109876", utm_content: "가을 런칭 A안" } };
const organic = { id: "inq-2", name: "김영희", phone: "010-9876-5432", created_at: "2026-10-19T23:10:00.000Z", utm: null };

describe("메타 리드 양식 변환", () => {
  it("열 순서가 메타 리드 파일과 같다", () => {
    expect([...LEAD_COLUMNS]).toEqual(["id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "form_id", "form_name", "is_organic", "platform", "full_name", "phone_number"]);
  });
  it("광고 유입: 숫자 ID 는 *_id, 이름은 *_name, platform ig, is_organic false", () => {
    const r = toLeadRow(paid);
    expect(r.campaign_id).toBe("120212345678901234");
    expect(r.campaign_name).toBe("");
    expect(r.adset_id).toBe("120298765432109876");
    expect(r.ad_id).toBe("");
    expect(r.ad_name).toBe("가을 런칭 A안");
    expect(r.platform).toBe("ig");
    expect(r.is_organic).toBe("false");
    expect(r.full_name).toBe("홍길동");
    expect(r.phone_number).toBe("p:+821012345678");
    expect(r.created_time).toBe("2026-10-20T14:32:11+09:00");
    expect(r.form_name).toContain("웹사이트");
  });
  it("직접 유입: is_organic true, 광고 열은 비움", () => {
    const r = toLeadRow(organic);
    expect(r.is_organic).toBe("true");
    expect(r.platform).toBe("");
    expect(r.campaign_id + r.campaign_name + r.adset_id + r.ad_id + r.ad_name).toBe("");
  });
  it("매체 이름은 메타 표기(ig / fb)로 맞추고 그 외는 그대로", () => {
    expect(toLeadRow({ ...organic, utm: { utm_source: "Instagram" } }).platform).toBe("ig");
    expect(toLeadRow({ ...organic, utm: { utm_source: "facebook" } }).platform).toBe("fb");
    expect(toLeadRow({ ...organic, utm: { utm_source: "naver" } }).platform).toBe("naver");
  });
  it("전화번호·시각 변환", () => {
    expect(toLeadPhone("010-1234-5678")).toBe("p:+821012345678");
    expect(toLeadPhone(null)).toBe("");
    expect(toKstIso("2026-01-01T00:00:00.000Z")).toBe("2026-01-01T09:00:00+09:00");
    expect(toKstIso("bad")).toBe("");
  });
  it("CSV: BOM + 머리글 + 행, 따옴표 이스케이프", () => {
    const csv = leadsCsv([{ ...paid, name: '홍"길"동' }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(LEAD_COLUMNS.map((c) => `"${c}"`).join(","));
    expect(lines[1]).toContain('"홍""길""동"');
  });
  it("유입 필터는 목록 화면과 같은 규칙 (source '-' 는 직접 유입)", () => {
    expect(matchesUtmFilter(paid, { source: "ig", campaign: "" })).toBe(true);
    expect(matchesUtmFilter(paid, { source: "fb", campaign: "" })).toBe(false);
    expect(matchesUtmFilter(paid, { source: "", campaign: "120212345678901234" })).toBe(true);
    expect(matchesUtmFilter(organic, { source: "-", campaign: "" })).toBe(true);
    expect(matchesUtmFilter(paid, { source: "-", campaign: "" })).toBe(false);
  });
});

describe("GET /api/admin/inquiries/export", () => {
  beforeEach(() => {
    db.tables.inquiries = [{ ...paid }, { ...organic }];
    me = { id: "admin-1", role: "admin" };
  });
  it("관리자가 아니면 403", async () => {
    me = null;
    const { GET } = await import("@/app/api/admin/inquiries/export/route");
    expect((await GET(new Request("https://test.example/api/admin/inquiries/export"))).status).toBe(403);
  });
  it("CSV 첨부로 내려주고 필터를 적용한다", async () => {
    const { GET } = await import("@/app/api/admin/inquiries/export/route");
    const res = await GET(new Request("https://test.example/api/admin/inquiries/export?source=ig"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toMatch(/rsc-leads-\d{4}-\d{2}-\d{2}\.csv/);
    const lines = (await res.text()).split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"inq-1"');
    const all = await (await GET(new Request("https://test.example/api/admin/inquiries/export"))).text();
    expect(all.split("\r\n")).toHaveLength(3);
  });
});
