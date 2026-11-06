import { describe, expect, it } from "vitest";
import { callsCsv, cell, interviewsCsv, maskName, needsCsv } from "@/lib/crm/export";
import { analyzeInsights } from "@/lib/crm/insights";
import { buildLeads, summarize } from "@/lib/crm/parse";
import type { CallsData } from "@/lib/crm/types";

/** 콜 현황 CSV (전략 분석용): 이름 가림 · 전화 미포함 · 주제별 태그 · 집계. 전부 가상 데이터 */
const HEAD = ["id", "created_time", "form_id", "form_name", "platform", "full_name", "phone_number", "1차 콜", "2차 콜", "3차 콜", "인터뷰 내용"];
const row = (o: Partial<Record<(typeof HEAD)[number], string>>) => HEAD.map((h) => o[h] ?? "");
function fakeData(): CallsData {
  const tabs = [{
    name: "CRM관리",
    rows: [HEAD,
      row({ id: "l:1", created_time: "2026-10-20T01:00:00+0000", form_id: "f:1", platform: "ig", full_name: "박채령", phone_number: "010-1111-2222", "1차 콜": "부재중", "2차 콜": "통화완료", "인터뷰 내용": "싱글 커뮤니티 / 와인 좋아함 / 평일 저녁 가능 / 결정사 경험 없음 / 금액 무관 / 92년생 여성 / 런칭시 연락" }),
      row({ id: "l:2", created_time: "2026-10-21T01:00:00+0000", form_id: "f:1", platform: "ig", full_name: "지운", phone_number: "010-3333-4444", "1차 콜": "거절" }),
      row({ id: "u-3", created_time: "2026-10-22T01:00:00+0000", form_id: "rsc-website", full_name: "홍길동전", phone_number: "010-5555-6666", "1차 콜": "통화완료", "인터뷰 내용": "ㅋㅋ 그냥 궁금" }),
    ],
    notes: [[1, 9, "골프 치는 중"]] as [number, number, string][],
  }];
  const parsed = buildLeads(tabs);
  return {
    ok: true, fetchedAt: "2026-10-28T03:00:00.000Z", sheetUrl: null, tabs: parsed.tabs, leads: parsed.leads,
    summary: summarize(parsed.leads, parsed.rows), memos: [], insights: analyzeInsights(parsed.leads), events: [], eventsEnabled: false,
    sheet: { notesSupported: true, noteCount: 1, scriptVersion: 10, updatedAt: null, source: "cache", masterTab: null, statusTab: "CRM관리", ignoredTabs: [] },
  };
}
const parse = (csv: string) => csv.replace(/^﻿/, "").split("\r\n");

describe("이름 가림·셀", () => {
  it("가운데를 x 로: 박채령 → 박x령, 지운 → 지x, 홍길동전 → 홍xx전, 한 글자 → x", () => {
    expect(maskName("박채령")).toBe("박x령");
    expect(maskName("지운")).toBe("지x");
    expect(maskName("홍길동전")).toBe("홍xx전");
    expect(maskName("김")).toBe("x");
    expect(maskName("  ")).toBe("");
  });
  it("숫자는 그대로, 글은 따옴표, 수식 시작 문자는 무력화", () => {
    expect(cell(12)).toBe("12");
    expect(cell('그는 "좋다" 했다')).toBe('"그는 ""좋다"" 했다"');
    expect(cell("=SUM(A1)")).toBe("\"'=SUM(A1)\"");
  });
});

describe("고객별 인터뷰 CSV", () => {
  it("인터뷰 있는 고객만 한 줄씩, 이름 가림, 전화번호 없음, 주제별 태그·노트 원문 포함", () => {
    const csv = interviewsCsv(fakeData());
    const lines = parse(csv);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(lines[0]).toContain('"원하는 것","관심 활동","가능한 일정","결정사 경험","금액 반응","프로필","후속 요청"');
    expect(lines).toHaveLength(3); // 머리 + 인터뷰 있는 2명 (거절한 지운은 노트 없음)
    expect(csv).not.toContain("박채령");
    expect(csv).not.toContain("1111");
    const park = lines.find((l) => l.includes('"박x령"'))!;
    expect(park).toContain('"메타"');
    expect(park).toContain('"통화완료"');
    expect(park).toContain('"싱글 커뮤니티"');
    expect(park).toContain('"골프 | 와인·미식"');
    expect(park).toContain('"결정사 경험 없음"');
    expect(park).toContain('"런칭 때 연락"');
    expect(park).toContain("골프 치는 중");
    const hong = lines.find((l) => l.includes('"홍xx전"'))!;
    expect(hong).toContain('"홈페이지"');
    expect(hong).toContain("ㅋㅋ 그냥 궁금"); // 분류 안 된 문장
  });
});

describe("니즈 집계 CSV", () => {
  it("요약 + 주제×태그 고객 수·비율 + 분류 안 된 문장(이름 가림)", () => {
    const csv = needsCsv(fakeData());
    expect(csv).toContain('"전체 신청(명)",3,');
    expect(csv).toContain('"통화완료(명)",2,"66.7%"');
    expect(csv).toContain('"인터뷰 내용 있는 고객(명)",2,');
    expect(csv).toContain('"원하는 것","싱글 커뮤니티",1,50,');
    expect(csv).toContain('"관심 활동","골프",1,50,');
    expect(csv).toContain('"","홍xx전","ㅋㅋ 그냥 궁금"');
    expect(csv).not.toContain("홍길동전");
  });
  it("파일 이름은 종류·한국 날짜", () => {
    const d = fakeData();
    expect(callsCsv("needs", d).filename).toBe("rsc-calls-needs-2026-10-28.csv");
    expect(callsCsv("interviews", d).filename).toBe("rsc-calls-interviews-2026-10-28.csv");
  });
});
