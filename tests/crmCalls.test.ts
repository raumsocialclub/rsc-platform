import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { memoGroups, parseTab, parseTabs, phoneKey, summarize } from "@/lib/crm/parse";
import { classifyCell, leadStatus } from "@/lib/crm/types";

/** 콜 현황 (M18): 시트 셀 분류 · 탭 파싱 · 집계 · 변경 기록. 전부 가상 데이터 */
const db = fakeDb();
vi.mock("@/lib/supabase/admin", () => ({ hasServiceRoleKey: () => true, createAdminClient: () => db.client }));
const HEAD = ["id", "created_time", "ad_id", "ad_name", "adset_id", "adset_name", "campaign_id", "campaign_name", "form_id", "form_name", "is_organic", "platform", "full_name", "phone_number", "1차 콜", "2차 콜", "3차 콜", "인터뷰 내용"];
const row = (o: Partial<Record<(typeof HEAD)[number], string>>) => HEAD.map((h) => o[h] ?? "");
const tab = (name: string, rows: string[][]) => ({ name, rows: [HEAD, ...rows] });

describe("셀 분류", () => {
  it("운영진이 적는 표현을 상태로", () => {
    expect(classifyCell("통화완료")).toBe("done");
    expect(classifyCell("통화 완료")).toBe("done");
    expect(classifyCell("부재중")).toBe("missed");
    expect(classifyCell("부재")).toBe("missed");
    expect(classifyCell("없는 번호")).toBe("invalid");
    expect(classifyCell("결번")).toBe("invalid");
    expect(classifyCell("2시")).toBe("callback");
    expect(classifyCell("230")).toBe("callback");
    expect(classifyCell("14:30")).toBe("callback");
    expect(classifyCell("문자 요청")).toBe("callback");
    expect(classifyCell("관심 없음")).toBe("declined");
    expect(classifyCell("")).toBe("pending");
    expect(classifyCell("ㅋㅋ")).toBe("other");
  });
  it("종합 상태: 통화완료가 하나라도 있으면 통화완료, 아니면 마지막 시도 기준", () => {
    expect(leadStatus(["부재중", "통화완료", ""])).toMatchObject({ status: "done", attempts: 2, last: "통화완료" });
    expect(leadStatus(["부재중", "부재중", ""])).toMatchObject({ status: "missed", attempts: 2 });
    expect(leadStatus(["부재중", "2시", ""])).toMatchObject({ status: "callback", attempts: 2, last: "2시" });
    expect(leadStatus(["", "", ""])).toMatchObject({ status: "pending", attempts: 0 });
  });
});

describe("탭 파싱", () => {
  it("머리글로 열을 찾고 빈 칸은 그대로, 완전히 빈 행은 건너뛴다", () => {
    const leads = parseTab(tab("웹사이트", [
      row({ id: "aaa", created_time: "2026-10-26T01:31:37+09:00", form_name: "라움소셜클럽 웹사이트 상담 신청", platform: "ig", full_name: "홍길동", phone_number: "010-1111-2222", "1차 콜": "부재중", "2차 콜": "통화완료", "인터뷰 내용": "런칭 연락" }),
      HEAD.map(() => ""),
      row({ id: "bbb", created_time: "2026-10-25T10:00:00+09:00", full_name: "김영희", phone_number: "010-3333-4444" }),
    ]));
    expect(leads).toHaveLength(2);
    expect(leads[0]).toMatchObject({ key: "웹사이트|aaa", tab: "웹사이트", name: "홍길동", phone: "010-1111-2222", calls: ["부재중", "통화완료", ""], memo: "런칭 연락", status: "done", attempts: 2, platform: "ig" });
    expect(leads[0].createdAt).toBe("2026-10-25T16:31:37.000Z");
    expect(leads[1]).toMatchObject({ status: "pending", attempts: 0, memo: "" });
  });
  it("손으로 덧붙인 행(이름,전화만)은 전화 칸을 찾아 살리고 키는 전화 해시", () => {
    const leads = parseTab(tab("10/22", [["정예림", "010-5555-6666", "", "", "", ""]]));
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name: "정예림", phone: "010-5555-6666", id: "", status: "pending", createdAt: null });
    expect(leads[0].key).toBe(`10/22|${phoneKey("010-5555-6666")}`);
    expect(leads[0].key).not.toContain("5555");
  });
  it("전화번호가 없는 행·머리글 없는 탭은 무시, 여러 탭은 최신 신청 순", () => {
    expect(parseTab({ name: "메모", rows: [["안내", "x"], ["아무거나", "y"]] })).toHaveLength(0);
    expect(parseTab(tab("웹사이트", [row({ id: "no-phone", full_name: "x" })]))).toHaveLength(0);
    const leads = parseTabs([
      tab("10/23", [row({ id: "l:1", created_time: "2026-10-23T15:00:00+09:00", full_name: "A", phone_number: "010-1000-0001" })]),
      tab("웹사이트", [row({ id: "w1", created_time: "2026-10-26T09:00:00+09:00", full_name: "B", phone_number: "010-1000-0002" })]),
      tab("10/22", [["손으로", "010-1000-0003"]]),
    ]);
    expect(leads.map((l) => l.name)).toEqual(["B", "A", "손으로"]);
  });
});

describe("집계·메모 요약", () => {
  const leads = parseTabs([
    tab("웹사이트", [
      row({ id: "1", full_name: "가", phone_number: "010-0000-0001", "1차 콜": "통화완료", "인터뷰 내용": "런칭 연락" }),
      row({ id: "2", full_name: "나", phone_number: "010-0000-0002", "1차 콜": "부재중", "2차 콜": "부재중", "3차 콜": "부재중" }),
      row({ id: "3", full_name: "다", phone_number: "010-0000-0003", "1차 콜": "없는 번호" }),
      row({ id: "4", full_name: "라", phone_number: "010-0000-0004" }),
    ]),
    tab("10/24", [
      row({ id: "l:5", full_name: "마", phone_number: "010-0000-0005", "1차 콜": "통화완료", "인터뷰 내용": "런칭  연락" }),
      row({ id: "l:6", full_name: "바", phone_number: "010-0000-0006", "1차 콜": "2시" }),
    ]),
  ]);
  it("상태별·시도 단계별·탭별 건수", () => {
    const s = summarize(leads);
    expect(s.total).toBe(6);
    expect(s.byStatus).toMatchObject({ done: 2, missed: 1, invalid: 1, pending: 1, callback: 1 });
    expect(s.attempts).toEqual([1, 4, 0, 1]);
    expect(s.withMemo).toBe(2);
    expect(s.byTab.find((t) => t.tab === "웹사이트")).toMatchObject({ total: 4, done: 1, missed: 1, invalid: 1, pending: 1 });
    expect(s.byTab.find((t) => t.tab === "10/24")).toMatchObject({ total: 2, done: 1, callback: 1 });
  });
  it("메모는 띄어쓰기만 다른 글을 같은 묶음으로, 많은 순", () => {
    const g = memoGroups(leads);
    expect(g).toEqual([{ label: "런칭 연락", count: 2, names: ["가", "마"] }]);
  });
});

describe("변경 기록 (crm_call_events)", () => {
  const L = (calls: [string, string, string], memo = "") => parseTab(tab("웹사이트", [row({ id: "x1", full_name: "홍길동", phone_number: "010-1234-5678", "1차 콜": calls[0], "2차 콜": calls[1], "3차 콜": calls[2], "인터뷰 내용": memo })]));
  beforeEach(() => { db.tables.crm_call_state = []; db.tables.crm_call_events = []; db.calls.length = 0; });

  it("첫 실행은 기준선만 잡고 이벤트를 만들지 않는다", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    const r = await syncCallEvents(L(["부재중", "", ""]));
    expect(r.enabled).toBe(true);
    expect(r.events).toEqual([]);
    expect(db.tables.crm_call_state).toHaveLength(1);
    expect(db.tables.crm_call_state[0]).toMatchObject({ lead_key: "웹사이트|x1", calls: ["부재중", "", ""], memo: "" });
    expect(JSON.stringify(db.tables.crm_call_state)).not.toContain("홍길동");
  });
  it("바뀐 칸마다 이벤트(이전 → 이후), 새 행은 '새 신청'", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    await syncCallEvents(L(["부재중", "", ""]));
    const r = await syncCallEvents([...L(["부재중", "통화완료", ""], "런칭 연락"), ...parseTab(tab("10/26", [row({ id: "l:9", full_name: "새사람", phone_number: "010-9999-0000" })]))]);
    const fields = r.events.map((e) => [e.key, e.field, e.before, e.after]);
    expect(fields).toEqual(expect.arrayContaining([
      ["웹사이트|x1", "call2", "", "통화완료"],
      ["웹사이트|x1", "memo", "", "런칭 연락"],
      ["10/26|l:9", "new", "", ""],
    ]));
    expect(r.events).toHaveLength(3);
    expect(db.tables.crm_call_state.find((s) => s.lead_key === "웹사이트|x1")).toMatchObject({ calls: ["부재중", "통화완료", ""], memo: "런칭 연락" });
    const again = await syncCallEvents(L(["부재중", "통화완료", ""], "런칭 연락"));
    expect(again.events).toHaveLength(3);
  });
  it("이벤트에는 개인정보가 없고, 이름은 화면에서 현재 시트 값으로 붙인다", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    await syncCallEvents(L(["", "", ""]));
    await syncCallEvents(L(["부재중", "", ""]));
    expect(JSON.stringify(db.tables.crm_call_events)).not.toMatch(/홍길동|1234-5678/);
  });
});
