import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fakeDb";
import { buildLeads, channelFromLabel, channelOf, isDerivedTab, memoGroups, mergeLeads, parseTab, parseTabs, phoneKey, summarize } from "@/lib/crm/parse";
import { classifyCell, leadStatus } from "@/lib/crm/types";
import { analyzeInsights, splitLines, tagLine } from "@/lib/crm/insights";

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
    expect(leads[0]).toMatchObject({ key: phoneKey("010-1111-2222"), tab: "웹사이트", tabs: ["웹사이트"], name: "홍길동", phone: "010-1111-2222", calls: ["부재중", "통화완료", ""], memo: "런칭 연락", status: "done", attempts: 2, platform: "ig", channel: "web" });
    expect(leads[0].key).toMatch(/^p:[0-9a-f]{16}$/);
    expect(leads[0].createdAt).toBe("2026-10-25T16:31:37.000Z");
    expect(leads[1]).toMatchObject({ status: "pending", attempts: 0, memo: "" });
  });
  it("손으로 덧붙인 행(이름,전화만)은 전화 칸을 찾아 살리고 키는 전화 해시", () => {
    const leads = parseTab(tab("10/22", [["정예림", "010-5555-6666", "", "", "", ""]]));
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({ name: "정예림", phone: "010-5555-6666", id: "", status: "pending", createdAt: null });
    expect(leads[0].key).toBe(phoneKey("010-5555-6666"));
    expect(leads[0].key).not.toContain("5555");
  });
  it("셀 노트(노란 말풍선)는 행 번호로 붙이고, 여러 칸이면 줄바꿈으로 잇는다", () => {
    const t = tab("웹사이트", [
      row({ id: "n1", full_name: "가상A", phone_number: "010-0000-0001", "1차 콜": "통화완료" }),
      row({ id: "n2", full_name: "가상B", phone_number: "010-0000-0002" }),
    ]);
    const leads = parseTab({ ...t, notes: [[1, 14, "- 1:1 관심\n- 평일 저녁 가능"], [1, 17, "런칭시 연락"], [5, 2, "범위 밖"]] });
    expect(leads[0].note).toBe("- 1:1 관심\n- 평일 저녁 가능\n런칭시 연락");
    expect(leads[1].note).toBe("");
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

describe("인터뷰 니즈 분석", () => {
  it("노트 문장을 나누고 앞의 기호를 뗀다", () => {
    expect(splitLines("- 1:1 관심. 싱글 커뮤니티도 괜찮음\n- 이성만남\n-평일 일정 조율 가능\n\n")).toEqual(["1:1 관심. 싱글 커뮤니티도 괜찮음", "이성만남", "평일 일정 조율 가능"]);
    expect(splitLines("- 와인 - 러닝 - 골프")).toEqual(["와인", "러닝", "골프"]);
  });
  it("문장을 주제 태그로 (가상 문장)", () => {
    const tags = (s: string) => tagLine(s).map((t) => `${t.theme}:${t.tag}`);
    expect(tags("1:1 관심. 싱글 커뮤니티도 괜찮음")).toEqual(expect.arrayContaining(["interest:1:1 매칭", "interest:싱글 커뮤니티"]));
    expect(tags("이성만남. 인맥형성. 취미")).toEqual(expect.arrayContaining(["interest:이성 만남", "interest:인맥·비즈니스", "interest:취미·액티비티"]));
    expect(tags("평일 저녁 조율 가능")).toEqual(expect.arrayContaining(["schedule:평일", "schedule:저녁·퇴근 후", "schedule:일정 조율 가능"]));
    expect(tags("와인. 러닝. 스쿠버다이빙. 비지니스 니즈")).toEqual(expect.arrayContaining(["activity:와인·미식", "activity:러닝·운동", "activity:수상·스쿠버", "interest:인맥·비즈니스"]));
    expect(tags("결정사 이용 경험 없음")).toEqual(["experience:결정사 경험 없음"]);
    expect(tags("결정사 이용중(좋은 조건의 남성이신듯. 적은 금액으로 이용중)")).toEqual(expect.arrayContaining(["experience:결정사 이용 중·경험 있음", "budget:금액 부담·민감", "profile:남성"]));
    expect(tags("결정사 이용중(좋은 조건의 남성이신듯. 적은 금액으로 이용중)")).not.toContain("experience:결정사 경험 없음");
    expect(tags("금액 무관. 퀄리티에 따라 결정")).toEqual(["budget:금액 무관·유연"]);
    expect(tags("금액은 융통성. 컨텐츠에 따라.")).toEqual(["budget:금액 무관·유연"]);
    expect(tags("41세 여성")).toEqual(expect.arrayContaining(["profile:여성", "profile:40대"]));
    expect(tags("30대 중반 남성 / 조건 좋은 느낌")).toEqual(expect.arrayContaining(["profile:남성", "profile:30대"]));
    expect(tags("런칭시 연락 바람 (할인)")).toEqual(expect.arrayContaining(["followup:런칭 때 연락", "budget:할인 요청"]));
    expect(tags("27일 연락 요청")).toContain("followup:추후·재연락");
    expect(tags("관심 없음. 여성 요가 모임 중")).toEqual(expect.arrayContaining(["followup:관심 없음·거절", "profile:여성"]));
    expect(tags("ㅇㅇ")).toEqual([]);
  });
  it("고객 단위로 집계하고, 안 걸린 문장은 따로 모은다", () => {
    const base = tab("웹사이트", [
      row({ id: "a", full_name: "가", phone_number: "010-0000-0001", "1차 콜": "통화완료", "인터뷰 내용": "런칭 연락" }),
      row({ id: "b", full_name: "나", phone_number: "010-0000-0002", "1차 콜": "통화완료" }),
      row({ id: "c", full_name: "다", phone_number: "010-0000-0003", "1차 콜": "부재중" }),
    ]);
    const leads = parseTabs([{ ...base, notes: [[1, 14, "- 1:1 관심\n- 1:1 로 꼭\n- 와인\n- 흠"], [2, 14, "- 싱글 커뮤니티\n- 와인"]] }]);
    const r = analyzeInsights(leads);
    expect(r.interviewed).toBe(2);
    expect(r.customers.map((c) => c.name)).toEqual(["가", "나"]);
    const interest = r.themes.find((t) => t.theme === "interest")!;
    expect(interest.tags).toEqual(expect.arrayContaining([expect.objectContaining({ tag: "1:1 매칭", count: 1 }), expect.objectContaining({ tag: "싱글 커뮤니티", count: 1 })]));
    expect(r.themes.find((t) => t.theme === "activity")!.tags[0]).toMatchObject({ tag: "와인·미식", count: 2 });
    expect(r.themes.find((t) => t.theme === "followup")!.tags[0]).toMatchObject({ tag: "런칭 때 연락", count: 1 });
    expect(r.untagged).toEqual([{ name: "가", line: "흠" }]);
    expect(r.customers[0].lines).toEqual(["1:1 관심", "1:1 로 꼭", "와인", "흠"]);
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
    expect(db.tables.crm_call_state[0]).toMatchObject({ lead_key: phoneKey("010-1234-5678"), calls: ["부재중", "", ""], memo: "" });
    expect(JSON.stringify(db.tables.crm_call_state)).not.toContain("홍길동");
  });
  it("바뀐 칸마다 이벤트(이전 → 이후), 새 행은 '새 신청'", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    await syncCallEvents(L(["부재중", "", ""]));
    const r = await syncCallEvents([...L(["부재중", "통화완료", ""], "런칭 연락"), ...parseTab(tab("10/26", [row({ id: "l:9", full_name: "새사람", phone_number: "010-9999-0000" })]))]);
    const fields = r.events.map((e) => [e.key, e.field, e.before, e.after]);
    const K = phoneKey("010-1234-5678");
    expect(fields).toEqual(expect.arrayContaining([
      [K, "call2", "", "통화완료"],
      [K, "memo", "", "런칭 연락"],
      [phoneKey("010-9999-0000"), "new", "", ""],
    ]));
    expect(r.events).toHaveLength(3);
    expect(db.tables.crm_call_state.find((s) => s.lead_key === K)).toMatchObject({ calls: ["부재중", "통화완료", ""], memo: "런칭 연락" });
    const again = await syncCallEvents(L(["부재중", "통화완료", ""], "런칭 연락"));
    expect(again.events).toHaveLength(3);
  });
  it("이벤트에는 개인정보가 없고, 이름은 화면에서 현재 시트 값으로 붙인다", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    await syncCallEvents(L(["", "", ""]));
    await syncCallEvents(L(["부재중", "", ""]));
    expect(JSON.stringify(db.tables.crm_call_events)).not.toMatch(/홍길동|1234-5678/);
  });
  it("인터뷰 노트는 내용 대신 해시·줄 수만 남긴다", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    const withNote = (note: string) => { const l = L(["통화완료", "", ""]); l[0].note = note; return l; };
    await syncCallEvents(withNote(""));
    const r = await syncCallEvents(withNote("- 1:1 관심\n- 41세 여성"));
    expect(r.events).toEqual([expect.objectContaining({ field: "note", before: "", after: "2줄" })]);
    expect(JSON.stringify(db.tables)).not.toMatch(/41세|1:1 관심/);
    const same = await syncCallEvents(withNote("- 1:1 관심\n- 41세 여성"));
    expect(same.events).toHaveLength(1);
  });
  it("예전 키 체계(탭|id)만 남아 있으면 기준선을 다시 잡고 '새 신청' 폭주 없이 옛 상태를 지운다", async () => {
    const { syncCallEvents } = await import("@/lib/crm/events");
    db.tables.crm_call_state = [{ lead_key: "웹사이트|x1", tab: "웹사이트", calls: ["", "", ""], memo: "", note_hash: "" }, { lead_key: "10/22|l:3", tab: "10/22", calls: ["", "", ""], memo: "", note_hash: "" }];
    const r = await syncCallEvents(L(["부재중", "", ""]));
    expect(r.events).toEqual([]);
    expect(db.tables.crm_call_state.map((s) => s.lead_key)).toEqual([phoneKey("010-1234-5678")]);
    const next = await syncCallEvents(L(["부재중", "통화완료", ""]));
    expect(next.events).toHaveLength(1);
  });
});

describe("시트 읽기 (Apps Script 응답)", () => {
  const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
  beforeEach(() => {
    process.env.CRM_SHEET_URL = "https://script.example/macros/s/x/exec";
    process.env.CRM_SHEET_TOKEN = "test-token";
  });
  it("셀 노트를 버리지 않고 파서까지 전달하며, 개수를 센다", async () => {
    vi.stubGlobal("fetch", ok({ ok: true, version: 2, url: "https://docs.google.com/x", tabs: [{ name: "웹", rows: [HEAD, row({ id: "a", full_name: "가상", phone_number: "010-0000-0009" })], notes: [[1, 14, "1:1 관심"], [1, 17, "평일 저녁"], ["x", 0, "깨진 값"], [2, 0, "   "]] }] }));
    const { fetchSheetTabs } = await import("@/lib/crm/sheet");
    const r = await fetchSheetTabs();
    expect(r.notesSupported).toBe(true);
    expect(r.noteCount).toBe(2);
    expect(r.scriptVersion).toBe(2);
    expect(parseTabs(r.tabs)[0].note).toBe("1:1 관심\n평일 저녁");
    const u = new URL((vi.mocked(fetch).mock.calls[0][0] as URL).toString());
    expect(u.searchParams.get("token")).toBe("test-token");
    vi.unstubAllGlobals();
  });
  it("구버전 스크립트(notes 칸 없음)는 notesSupported=false 로 알려 준다", async () => {
    vi.stubGlobal("fetch", ok({ ok: true, tabs: [{ name: "웹", rows: [HEAD] }] }));
    const { fetchSheetTabs } = await import("@/lib/crm/sheet");
    const r = await fetchSheetTabs();
    expect(r.notesSupported).toBe(false);
    expect(r.noteCount).toBe(0);
    expect(r.scriptVersion).toBe(1);
    vi.unstubAllGlobals();
  });
});

describe("중복 합치기 (전화번호 기준) · 파생 탭 제외 · 채널", () => {
  const master = (rows: string[][]) => tab("DB추출용", rows);
  it("채널 판정: 메타 리드 id 는 l:…, 홈페이지는 UUID 또는 form_id rsc-website", () => {
    expect(channelOf({ id: "l:1838526270921341", formId: "f:1448093067468448", form: "라움소셜클럽 파운딩 멤버신청" })).toBe("meta");
    expect(channelOf({ id: "f2ece977-8f41-4079-a1c2-441202969b15", formId: "rsc-website", form: "라움소셜클럽 웹사이트 상담 신청" })).toBe("web");
    expect(channelOf({ id: "", formId: "", form: "" })).toBe("");
  });
  it("수식으로 만든 탭(DB관리·일별현황·자동정리·사용안내, 또는 '입력시트 행' 머리글)은 건너뛴다", () => {
    expect(isDerivedTab({ name: "DB관리", rows: [["RAUM SOCIAL CLUB | DB 관리"]] })).toBe(true);
    expect(isDerivedTab({ name: "일별현황", rows: [["수집일", "전체 신청", "홈페이지", "메타", "신규 연락처"]] })).toBe(true);
    expect(isDerivedTab({ name: "뭔가", rows: [["수집일", "이름 · full_name", "전화번호 · phone_number", "입력시트 행", "신청 ID"]] })).toBe(true);
    expect(isDerivedTab({ name: "웹사이트", rows: [HEAD] })).toBe(false);
    const r = buildLeads([
      { name: "자동정리", rows: [["수집일", "이름 · full_name", "전화번호 · phone_number", "1차 콜", "입력시트 행"], ["2026-10-25", "가상", "010-7000-0001", "통화완료", "2"]] },
      master([row({ id: "u1", created_time: "2026-10-25T10:00:00+09:00", form_id: "rsc-website", full_name: "가상", phone_number: "010-7000-0001", "1차 콜": "통화완료" })]),
    ]);
    expect(r.ignoredTabs).toEqual(["자동정리"]);
    expect(r.masterTab).toBe("DB추출용");
    expect(r.leads).toHaveLength(1);
    expect(r.rows).toBe(1);
  });
  it("같은 사람이 마스터 탭과 날짜 탭에 있으면 1명: 대표는 마스터 행, 콜 결과는 가장 많이 적힌 행, 노트는 합침", () => {
    const sheet = [
      master([
        row({ id: "u1", created_time: "2026-10-25T21:43:47+09:00", form_id: "rsc-website", form_name: "라움소셜클럽 웹사이트 상담 신청", platform: "ig", full_name: "가상A", phone_number: "010-7000-0001", "1차 콜": "부재중" }),
        row({ id: "l:77", created_time: "2026-10-23T12:00:00+09:00", form_id: "f:1448", form_name: "라움소셜클럽 파운딩 멤버신청", platform: "fb", full_name: "가상B", phone_number: "010-7000-0002", "1차 콜": "통화완료", "인터뷰 내용": "런칭 연락" }),
      ]),
      { ...tab("웹사이트", [row({ id: "u1", created_time: "2026-10-25T21:43:47+09:00", form_id: "rsc-website", full_name: "가상A", phone_number: "010-7000-0001", "1차 콜": "부재중", "2차 콜": "통화완료", "인터뷰 내용": "런칭 때 연락" })]), notes: [[1, 14, "- 와인 모임 관심"]] as [number, number, string][] },
      { ...tab("10/23", [row({ id: "l:77", created_time: "2026-10-23T12:00:00+09:00", form_id: "f:1448", full_name: "가상B", phone_number: "010-7000-0002", "1차 콜": "통화완료" })]), notes: [[1, 17, "- 평일 저녁 가능"]] as [number, number, string][] },
    ];
    const r = buildLeads(sheet);
    expect(r.rows).toBe(4);
    expect(r.leads).toHaveLength(2);
    const a = r.leads.find((l) => l.name === "가상A")!;
    expect(a).toMatchObject({ tab: "DB추출용", tabs: ["DB추출용", "웹사이트"], channel: "web", calls: ["부재중", "통화완료", ""], status: "done", attempts: 2, memo: "런칭 때 연락", note: "- 와인 모임 관심" });
    expect(a.subs).toHaveLength(1); // 같은 신청 id 가 두 탭에 복사된 것 → 1건
    const b = r.leads.find((l) => l.name === "가상B")!;
    expect(b).toMatchObject({ channel: "meta", memo: "런칭 연락", note: "- 평일 저녁 가능", status: "done" });
    const s = summarize(r.leads, r.rows);
    expect(s).toMatchObject({ total: 2, rows: 4, submissions: 2, resubmitted: 0, crossChannel: 0 });
    expect(s.byChannel.map((c) => [c.tab, c.total])).toEqual([["홈페이지", 1], ["메타", 1]]);
  });
  it("같은 사람이 두 번(다른 id) 신청하면 재신청, 홈페이지·메타 양쪽이면 채널 중복, 최초·최근 신청일을 둘 다 가진다", () => {
    const leads = mergeLeads([
      ...parseTab(master([
        row({ id: "l:1", created_time: "2026-10-21T10:00:00+09:00", form_id: "f:1", full_name: "가상C", phone_number: "010-7000-0003" }),
        row({ id: "u9", created_time: "2026-10-25T10:00:00+09:00", form_id: "rsc-website", full_name: "가상C", phone_number: "010-7000-0003", "1차 콜": "통화완료" }),
        row({ id: "l:5", created_time: "2026-10-24T10:00:00+09:00", form_id: "f:1", full_name: "가상D", phone_number: "010-7000-0004" }),
      ])),
    ], "DB추출용");
    expect(leads).toHaveLength(2);
    const c = leads.find((l) => l.name === "가상C")!;
    expect(c.subs).toHaveLength(2);
    expect(c.channels.sort()).toEqual(["meta", "web"]);
    expect(c.createdAt).toBe("2026-10-21T01:00:00.000Z");
    expect(c.lastAt).toBe("2026-10-25T01:00:00.000Z");
    expect(c.status).toBe("done");
    expect(leads[0].name).toBe("가상C"); // 최근 신청 순
    const s = summarize(leads, 3);
    expect(s).toMatchObject({ total: 2, rows: 3, submissions: 3, resubmitted: 1, crossChannel: 1 });
  });
  it("일별 신청 집계는 최근 14일, 신청 건 단위로 채널·처음/재신청을 센다", () => {
    const d = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    const leads = mergeLeads(parseTab(master([
      row({ id: "l:1", created_time: d(1), form_id: "f:1", full_name: "가상E", phone_number: "010-7000-0005" }),
      row({ id: "u2", created_time: d(0), form_id: "rsc-website", full_name: "가상E", phone_number: "010-7000-0005" }),
      row({ id: "u3", created_time: d(0), form_id: "rsc-website", full_name: "가상F", phone_number: "010-7000-0006" }),
      row({ id: "l:4", created_time: d(40), form_id: "f:1", full_name: "가상G", phone_number: "010-7000-0007" }),
    ])), "DB추출용");
    const s = summarize(leads);
    expect(s.byDay).toHaveLength(2);
    expect(s.byDay[0]).toMatchObject({ total: 2, web: 2, meta: 0, fresh: 1, again: 1 });
    expect(s.byDay[1]).toMatchObject({ total: 1, web: 0, meta: 1, fresh: 1, again: 0 });
  });
});

describe("CRM관리 탭 (상태 입력 한 장) 연동", () => {
  const CRM_HEAD = ["수집일", "수집 채널", "이름", "전화번호", "현재 상태", "1차 콜 · 입력", "2차 콜 · 입력", "3차 콜 · 입력", "상담 메모 · 입력", "방문경로", "신청폼", "중복 / 재신청", "추출용 행", "신청 ID"];
  const crm = (rows: string[][]) => ({ name: "CRM관리", rows: [CRM_HEAD, ...rows] });
  const extract = (rows: string[][]) => tab("DB추출용", rows);
  it("CRM관리 머리글(수집일·수집 채널·전화번호·N차 콜 · 입력·상담 메모 · 입력·신청 ID)을 읽는다", () => {
    const leads = parseTab(crm([
      ["2026-10-26", "홈페이지", "가상H", "010-7000-0008", "부재중", "부재중", "부재중", "", "", "인스타그램", "라움소셜클럽 웹사이트 상담 신청", "신규", "2", "f2ece977-0000-4079-a1c2-441202969b15"],
      ["2026-10-25", "메타", "가상I", "010-7000-0009", "통화완료", "통화완료", "", "", "추후 본인이 연락", "인스타그램", "라움소셜클럽 파운딩 멤버신청", "신규", "9", "l:2090186471630200"],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    ]));
    expect(leads).toHaveLength(2);
    expect(leads[0]).toMatchObject({ name: "가상H", channel: "web", calls: ["부재중", "부재중", ""], status: "missed", attempts: 2, id: "f2ece977-0000-4079-a1c2-441202969b15", form: "라움소셜클럽 웹사이트 상담 신청" });
    expect(leads[0].createdAt && leads[0].createdAt.slice(0, 10)).toBe("2026-10-26");
    expect(leads[1]).toMatchObject({ name: "가상I", channel: "meta", status: "done", memo: "추후 본인이 연락" });
    expect(channelFromLabel("홈페이지")).toBe("web");
    expect(channelFromLabel("메타")).toBe("meta");
    expect(channelFromLabel("")).toBe("");
  });
  it("콜 결과·메모는 CRM관리 행을 우선한다 — 거기서 고치면(줄여도) 그대로 반영, 비어 있으면 다른 탭 값", () => {
    const r = buildLeads([
      extract([
        row({ id: "u1", created_time: "2026-10-25T21:43:47+09:00", form_id: "rsc-website", full_name: "가상J", phone_number: "010-7000-0010", "1차 콜": "부재중", "2차 콜": "부재중", "3차 콜": "부재중", "인터뷰 내용": "옛 메모" }),
        row({ id: "l:5", created_time: "2026-10-24T10:00:00+09:00", form_id: "f:1", full_name: "가상K", phone_number: "010-7000-0011", "1차 콜": "부재중" }),
      ]),
      crm([
        ["2026-10-25", "홈페이지", "가상J", "010-7000-0010", "통화완료", "통화완료", "", "", "런칭 때 연락", "인스타그램", "라움소셜클럽 웹사이트 상담 신청", "신규", "2", "u1"],
        ["2026-10-24", "메타", "가상K", "010-7000-0011", "", "", "", "", "", "인스타그램", "라움소셜클럽 파운딩 멤버신청", "신규", "3", "l:5"],
      ]),
      tab("10/24", [row({ id: "l:5", created_time: "2026-10-24T10:00:00+09:00", form_id: "f:1", full_name: "가상K", phone_number: "010-7000-0011", "1차 콜": "부재중", "2차 콜": "통화완료" })]),
    ]);
    expect(r.masterTab).toBe("DB추출용");
    expect(r.statusTab).toBe("CRM관리");
    expect(r.leads).toHaveLength(2);
    const j = r.leads.find((l) => l.name === "가상J")!;
    expect(j).toMatchObject({ calls: ["통화완료", "", ""], status: "done", attempts: 1, memo: "런칭 때 연락", createdAt: "2026-10-25T12:43:47.000Z" });
    expect(j.subs).toHaveLength(1);
    const k = r.leads.find((l) => l.name === "가상K")!;
    expect(k).toMatchObject({ calls: ["부재중", "통화완료", ""], status: "done", attempts: 2 });
  });
});

describe("CRM관리 셀 노트 → 니즈 분석 (스크린샷 문장, 가상 데이터)", () => {
  const CRM_HEAD = ["수집일", "수집 채널", "이름", "전화번호", "현재 상태", "1차 콜 · 입력", "2차 콜 · 입력", "3차 콜 · 입력", "상담 메모 · 입력", "방문경로", "신청폼", "중복 / 재신청", "추출용 행", "신청 ID"];
  const NOTE = "- 싱글 커뮤니티\n- 인맥형성 / 이성만남\n- 평일 일정 조율 가능\n- 와인 등 관심\n- 타업체 이용 경험 없음\n- 금액은 융통성\n- 79년생 여성\n- 런칭시 연락 바람 (할인)";
  it("상담 메모 칸(I열)에 붙인 노트가 사람에게 붙고, 마스터 탭 행과 합쳐져도 남는다", () => {
    const r = buildLeads([
      tab("DB추출용", [row({ id: "l:9", created_time: "2026-10-24T10:00:00+09:00", form_id: "f:1", full_name: "가상L", phone_number: "010-7000-0012" })]),
      { name: "CRM관리", rows: [CRM_HEAD, ["2026-10-24", "메타", "가상L", "010-7000-0012", "통화완료", "통화완료", "", "", "런칭 연락", "인스타그램", "라움소셜클럽 파운딩 멤버신청", "신규", "2", "l:9"]], notes: [[1, 8, NOTE]] },
    ]);
    expect(r.leads).toHaveLength(1);
    expect(r.leads[0].note).toBe(NOTE);
    expect(r.leads[0].memo).toBe("런칭 연락");
    const ins = analyzeInsights(r.leads);
    expect(ins.interviewed).toBe(1);
    const tags = ins.customers[0].tags.map((t) => t.tag);
    expect(tags).toEqual(expect.arrayContaining(["싱글 커뮤니티", "인맥·비즈니스", "이성 만남", "평일", "일정 조율 가능", "와인·미식", "결정사 경험 없음", "금액 무관·유연", "여성", "40대", "런칭 때 연락", "할인 요청"]));
    expect(tags).not.toContain("결정사 이용 중·경험 있음");
    expect(ins.customers[0].untagged).toEqual([]);
  });
  it("경험 표현: 타업체 이용 중 → 있음, 이용 경험 없음 → 없음, NN년생 → 나이대", () => {
    expect(tagLine("타업체 이용 중").map((t) => t.tag)).toContain("결정사 이용 중·경험 있음");
    expect(tagLine("이용 경험 없음").map((t) => t.tag)).toEqual(["결정사 경험 없음"]);
    expect(tagLine("결정사는 처음").map((t) => t.tag)).toEqual(["결정사 경험 없음"]);
    expect(tagLine("85년생 남성").map((t) => t.tag)).toEqual(expect.arrayContaining(["남성", `${Math.floor((new Date().getFullYear() - 1985) / 10) * 10}대`]));
  });
});
