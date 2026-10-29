import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { CSV_COLUMNS, LEAD_COLUMNS, csvCell, isOrganic, leadRangeBounds, leadsCsv, matchesUtmFilter, parseLeadRange, toKstIso, toLeadPhone, toLeadRow } from "@/lib/admin/leads";

/** 상담 신청 → 메타 리드 CSV 양식 (가상 데이터) */
const db = fakeDb();
let me: { id: string; role: string } | null = { id: "owner-1", role: "owner" };
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => db.client }));
vi.mock("@/lib/admin/guard", () => ({ requireAdmin: async () => (me && (me.role === "admin" || me.role === "owner") ? me : null), requireOwner: async () => (me?.role === "owner" ? me : null), OWNER_ONLY_MESSAGE: "주관리자만" }));

const CAMPAIGN_ID = "120212345678901234";
const ADSET_ID = "120298765432109876";
const paid = { id: "inq-1", name: "홍길동", phone: "010-1234-5678", created_at: "2026-10-20T05:32:11.000Z", utm: { utm_source: "ig", utm_medium: "paid", utm_campaign: CAMPAIGN_ID, utm_term: ADSET_ID, utm_content: "가을 런칭 A안" } };
const noUtm = { id: "inq-2", name: "김영희", phone: "010-9876-5432", created_at: "2026-10-19T23:10:00.000Z", utm: null };
const profile = { id: "inq-3", name: "박민수", phone: "010-5555-1234", created_at: "2026-10-19T10:00:00.000Z", utm: { utm_source: "ig", utm_medium: "profile" } };
const sourceOnly = { id: "inq-4", name: "이서연", phone: "010-4444-1234", created_at: "2026-10-18T10:00:00.000Z", utm: { utm_source: "ig" } };

describe("메타 리드 양식 변환", () => {
  it("앞 14열은 메타 리드 파일과 같고 뒤에 원본 UTM 5열이 붙는다", () => {
    expect([...LEAD_COLUMNS]).toEqual(["id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "form_id", "form_name", "is_organic", "platform", "full_name", "phone_number"]);
    expect([...CSV_COLUMNS].slice(14)).toEqual(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]);
  });
  it("광고 유입: 메타 ID 는 *_id, 이름은 *_name 그대로, platform ig", () => {
    const r = toLeadRow(paid);
    expect(r.campaign_id).toBe(CAMPAIGN_ID);
    expect(r.campaign_name).toBe("");
    expect(r.adset_id).toBe(ADSET_ID);
    expect(r.ad_id).toBe("");
    expect(r.ad_name).toBe("가을 런칭 A안");
    expect(r.platform).toBe("ig");
    expect(r.is_organic).toBe("false");
    expect(r.full_name).toBe("홍길동");
    expect(r.phone_number).toBe("p:+821012345678");
    expect(r.created_time).toBe("2026-10-20T14:32:11+09:00");
    expect(r.form_name).toContain("웹사이트");
    expect(r.utm_campaign).toBe(CAMPAIGN_ID);
    expect(r.utm_content).toBe("가을 런칭 A안");
  });
  it("is_organic: 유료 표기·메타 ID → false, 무료 표기 → true, UTM 없음·매체 표기 없음 → 빈칸(판단 불가)", () => {
    expect(isOrganic({ utm_source: "ig", utm_medium: "paid" })).toBe("false");
    expect(isOrganic({ utm_source: "ig", utm_medium: "paid_social" })).toBe("false");
    expect(isOrganic({ utm_source: "fb", utm_campaign: CAMPAIGN_ID })).toBe("false");
    expect(isOrganic({ utm_source: "ig", utm_medium: "profile" })).toBe("true");
    expect(isOrganic({ utm_source: "ig", utm_medium: "social" })).toBe("true");
    expect(isOrganic({ utm_source: "ig" })).toBe("");
    expect(isOrganic({ utm_source: "ig", utm_campaign: "oct-launch" })).toBe("");
    expect(isOrganic(null)).toBe("");
    expect(toLeadRow(noUtm).is_organic).toBe("");
    expect(toLeadRow(profile).is_organic).toBe("true");
    expect(toLeadRow(sourceOnly).is_organic).toBe("");
  });
  it("UTM 없는 신청은 광고 열·platform 이 비고 원본 UTM 열도 빈칸", () => {
    const r = toLeadRow(noUtm);
    expect(r.platform).toBe("");
    expect(r.campaign_id + r.campaign_name + r.adset_id + r.ad_id + r.ad_name + r.utm_source + r.utm_medium).toBe("");
  });
  it("매체 이름은 메타 표기(ig / fb)로 맞추고 그 외는 그대로", () => {
    expect(toLeadRow({ ...noUtm, utm: { utm_source: "Instagram" } }).platform).toBe("ig");
    expect(toLeadRow({ ...noUtm, utm: { utm_source: "facebook" } }).platform).toBe("fb");
    expect(toLeadRow({ ...noUtm, utm: { utm_source: "naver" } }).platform).toBe("naver");
  });
  it("전화번호: 하이픈·공백·괄호 제거, 0 → +82, 이미 82 면 그대로, 모르는 꼴은 원본 유지, 빈 값은 빈칸", () => {
    expect(toLeadPhone("010-1234-5678")).toBe("p:+821012345678");
    expect(toLeadPhone(" 010 1234 5678 ")).toBe("p:+821012345678");
    expect(toLeadPhone("(010)1234-5678")).toBe("p:+821012345678");
    expect(toLeadPhone("011-234-5678")).toBe("p:+82112345678");
    expect(toLeadPhone("02-123-4567")).toBe("p:+8221234567");
    expect(toLeadPhone("+82 10-1234-5678")).toBe("p:+821012345678");
    expect(toLeadPhone("821012345678")).toBe("p:+821012345678");
    expect(toLeadPhone("+1 415 555 0100")).toBe("+1 415 555 0100");
    expect(toLeadPhone("문의 후 안내")).toBe("문의 후 안내");
    expect(toLeadPhone(null)).toBe("");
    expect(toLeadPhone("   ")).toBe("");
  });
  it("시각은 한국 시간 ISO", () => {
    expect(toKstIso("2026-01-01T00:00:00.000Z")).toBe("2026-01-01T09:00:00+09:00");
    expect(toKstIso("bad")).toBe("");
  });
  it("셀: 숫자만이면 =\"…\" 로 감싸 엑셀이 텍스트로 열고, 수식 시작 글자는 ' 로 무력화, 따옴표는 두 번", () => {
    expect(csvCell(CAMPAIGN_ID)).toBe(`"=""${CAMPAIGN_ID}"""`);
    expect(csvCell("=cmd|' /C calc'!A0")).toBe(`"'=cmd|' /C calc'!A0"`);
    expect(csvCell("+1")).toBe(`"'+1"`);
    expect(csvCell("-x")).toBe(`"'-x"`);
    expect(csvCell("@a")).toBe(`"'@a"`);
    expect(csvCell('홍"길"동')).toBe('"홍""길""동"');
    expect(csvCell("p:+821012345678")).toBe('"p:+821012345678"');
    expect(csvCell("")).toBe('""');
  });
  it("CSV: BOM + 머리글 + 행, 메타 ID 는 텍스트 보존 식, 이름의 수식은 무력화", () => {
    const csv = leadsCsv([{ ...paid, name: "=HYPERLINK(\"x\")" }, noUtm]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(CSV_COLUMNS.map((c) => `"${c}"`).join(","));
    expect(lines[1]).toContain(`"=""${CAMPAIGN_ID}"""`);
    expect(lines[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(lines[1]).toContain('"p:+821012345678"');
  });
  it("유입 필터는 목록 화면과 같은 규칙 (source '-' 는 UTM 기록 없음)", () => {
    expect(matchesUtmFilter(paid, { source: "ig", campaign: "" })).toBe(true);
    expect(matchesUtmFilter(paid, { source: "fb", campaign: "" })).toBe(false);
    expect(matchesUtmFilter(paid, { source: "", campaign: CAMPAIGN_ID })).toBe(true);
    expect(matchesUtmFilter(noUtm, { source: "-", campaign: "" })).toBe(true);
    expect(matchesUtmFilter(paid, { source: "-", campaign: "" })).toBe(false);
  });
});

describe("GET /api/admin/inquiries/export", () => {
  beforeEach(() => {
    db.tables.inquiries = [{ ...paid }, { ...noUtm }, { ...profile }];
    me = { id: "owner-1", role: "owner" };
  });
  it("주관리자가 아니면 403 (부관리자 포함)", async () => {
    const { GET } = await import("@/app/api/admin/inquiries/export/route");
    me = { id: "admin-1", role: "admin" };
    expect((await GET(new Request("https://test.example/api/admin/inquiries/export"))).status).toBe(403);
    me = null;
    expect((await GET(new Request("https://test.example/api/admin/inquiries/export"))).status).toBe(403);
  });
  it("CSV 첨부 + 캐시 금지 헤더, 필터 적용", async () => {
    const { GET } = await import("@/app/api/admin/inquiries/export/route");
    const res = await GET(new Request("https://test.example/api/admin/inquiries/export?source=ig"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toMatch(/rsc-leads-all-\d{4}-\d{2}-\d{2}\.csv/);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    const lines = (await res.text()).split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"inq-1"');
    expect(lines[2]).toContain('"inq-3"');
    const all = await (await GET(new Request("https://test.example/api/admin/inquiries/export"))).text();
    expect(all.split("\r\n")).toHaveLength(4);
  });
  it("from/to 는 한국 날짜(양 끝 포함)로 신청일을 거르고 파일명에 기간이 들어간다", async () => {
    const { GET } = await import("@/app/api/admin/inquiries/export/route");
    // paid 10-20 14:32 KST, noUtm 10-20 08:10 KST(UTC 로는 19일 밤), profile 10-19 19:00 KST
    const day = await GET(new Request("https://test.example/api/admin/inquiries/export?from=2026-10-20&to=2026-10-20"));
    expect(day.headers.get("Content-Disposition")).toContain('filename="rsc-leads-2026-10-20_2026-10-20.csv"');
    const lines = (await day.text()).split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('"inq-1"');
    expect(lines[2]).toContain('"inq-2"');
    const prev = (await (await GET(new Request("https://test.example/api/admin/inquiries/export?from=2026-10-19&to=2026-10-19"))).text()).split("\r\n");
    expect(prev).toHaveLength(2);
    expect(prev[1]).toContain('"inq-3"');
    // 기간 + 유입 필터 함께
    const both = (await (await GET(new Request("https://test.example/api/admin/inquiries/export?from=2026-10-19&to=2026-10-20&source=ig"))).text()).split("\r\n");
    expect(both).toHaveLength(3);
    // 잘못된 기간(역순·형식 오류)은 전체
    const bad = (await (await GET(new Request("https://test.example/api/admin/inquiries/export?from=2026-10-21&to=2026-10-19"))).text()).split("\r\n");
    expect(bad).toHaveLength(4);
  });
  it("1000건이 넘어도 전체를 내려준다 (Supabase 1000행 제한을 범위로 넘김)", async () => {
    db.tables.inquiries = Array.from({ length: 2350 }, (_, i) => ({ id: `inq-${i}`, name: `회원${i}`, phone: "010-0000-0000", created_at: "2026-10-01T00:00:00.000Z", utm: i % 2 ? { utm_source: "ig" } : null }));
    const { GET } = await import("@/app/api/admin/inquiries/export/route");
    const all = (await (await GET(new Request("https://test.example/api/admin/inquiries/export"))).text()).split("\r\n");
    expect(all).toHaveLength(2351);
    const ig = (await (await GET(new Request("https://test.example/api/admin/inquiries/export?source=ig"))).text()).split("\r\n");
    expect(ig).toHaveLength(1176);
  });
});

describe("CSV 기간 파싱", () => {
  it("둘 다 있으면 그대로, 하나만 있으면 하루, 없거나 틀리면 전체(null)", () => {
    expect(parseLeadRange({ from: "2026-10-01", to: "2026-10-07" })).toEqual({ from: "2026-10-01", to: "2026-10-07" });
    expect(parseLeadRange({ from: "2026-10-05", to: null })).toEqual({ from: "2026-10-05", to: "2026-10-05" });
    expect(parseLeadRange({ from: null, to: "2026-10-05" })).toEqual({ from: "2026-10-05", to: "2026-10-05" });
    expect(parseLeadRange({})).toBeNull();
    expect(parseLeadRange({ from: "2026-10-07", to: "2026-10-01" })).toBeNull();
    expect(parseLeadRange({ from: "20261001", to: "2026-10-07" })).toEqual({ from: "2026-10-07", to: "2026-10-07" });
    expect(parseLeadRange({ from: "2026-13-40", to: "2026-10-07" })).toEqual({ from: "2026-10-07", to: "2026-10-07" });
  });
  it("경계는 한국 자정 기준 UTC: from 00:00 KST 이상, to 다음날 00:00 KST 미만", () => {
    expect(leadRangeBounds({ from: "2026-10-20", to: "2026-10-20" })).toEqual({ gte: "2026-10-19T15:00:00.000Z", lt: "2026-10-20T15:00:00.000Z" });
    expect(leadRangeBounds({ from: "2026-10-31", to: "2026-10-31" }).lt).toBe("2026-10-31T15:00:00.000Z");
  });
});
