import { describe, expect, it } from "vitest";
import type { InquiryRow } from "@/components/admin/InquiryDetail";
import { APPLY_CSV_COLUMNS, applyAnswers, applyCsv, applySummary, matchesKind, parseKind } from "@/lib/apply/export";

/** 상담 전 설문 응답의 어드민 종류 필터 + 분석용 CSV. 전부 가상 데이터 */
const apply: InquiryRow = {
  id: "11111111-2222-3333-4444-555555555555", name: "홍길동", phone: "010-1234-5678", email: "hong@example.com", result_type: null, status: "pending", memo: null,
  created_at: "2026-11-04T01:00:00Z",
  answers: { form: "apply", route: "유튜브", slot: "", ref: "RSC-TEST", consentAt: "2026-11-04T01:00:00Z", consentVersion: "2026-10-01",
    answers: [{ key: "gender", label: "기본 정보 · 성별", question: "성별", answer: "남성" }],
    apply: { gender: "남성", birth: "1989-01-06", joinRoute: "유튜브", refCode: "RSC-TEST", height: "178", marital: "미혼", priority1: "매력(성격)", avoidJobs: "상관없음", t1: "=내가 먼저" } },
  utm: { utm_source: "instagram", utm_campaign: "nov" },
};
const fit: InquiryRow = { id: "66666666-7777-8888-9999-000000000000", name: "김영희", phone: "010-0000-0000", email: null, result_type: "THE SETTLER", status: "contacted", memo: null, created_at: "2026-11-03T05:00:00Z", answers: { route: "인스타그램", slot: "저녁" }, utm: null };

describe("종류 필터", () => {
  it("apply 는 설문만, fit 은 홈 상담 신청만, 빈 값은 전체", () => {
    expect(parseKind("apply")).toBe("apply"); expect(parseKind("x")).toBe(""); expect(parseKind(null)).toBe("");
    expect(matchesKind(apply, "apply")).toBe(true); expect(matchesKind(fit, "apply")).toBe(false);
    expect(matchesKind(apply, "fit")).toBe(false); expect(matchesKind(fit, "fit")).toBe(true);
    expect(matchesKind(fit, "")).toBe(true);
  });
  it("목록 요약은 성별 · 출생연도, 원본이 없는 옛 행은 평탄화 답으로 되살린다", () => {
    expect(applySummary(apply)).toBe("남성 · 1989년생");
    const old = { answers: { ...apply.answers!, apply: undefined } };
    expect(applyAnswers(old)).toEqual({ gender: "남성" });
    expect(applySummary(old)).toBe("남성");
    expect(applySummary(fit)).toBe("");
  });
});

describe("설문 응답 CSV", () => {
  it("고정 열 + 설문 전 문항(이름·휴대폰·이메일 제외) + UTM·동의 열, 한 응답 = 한 줄", () => {
    expect(APPLY_CSV_COLUMNS.slice(0, 5)).toEqual(["신청일", "상태", "이름", "휴대폰", "이메일"]);
    expect(APPLY_CSV_COLUMNS).toContain("기본 정보 · 성별");
    expect(APPLY_CSV_COLUMNS.some((c) => c.startsWith("연애성향 질문 · "))).toBe(true);
    expect(APPLY_CSV_COLUMNS.some((c) => c.endsWith("· 이름") || c.endsWith("· 휴대폰 번호"))).toBe(false);
    const csv = applyCsv([apply]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines).toHaveLength(2);
    const split = (line: string) => line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "")).filter((c, i, arr) => !(i === arr.length - 1 && c === ""));
    expect(split(lines[0])).toHaveLength(APPLY_CSV_COLUMNS.length); // 문항 이름에 쉼표가 있어도 따옴표로 감싸 열 수가 맞는다
    const cells = split(lines[1]);
    expect(cells).toHaveLength(APPLY_CSV_COLUMNS.length);
    const col = (name: string) => cells[APPLY_CSV_COLUMNS.indexOf(name)];
    expect(col("신청일")).toBe('"2026-11-04T10:00:00+09:00"');
    expect(col("상태")).toBe('"대기"');
    expect(col("기본 정보 · 키")).toBe('"178cm"');
    expect(col("기본 정보 · 생년월일")).toBe('"1989-01-06"');
    expect(col("이상형 기피사항 · 직업분류")).toBe('"상관없음"');
    expect(col("utm_source")).toBe('"instagram"');
    expect(col("동의문 버전")).toBe('"2026-10-01"');
  });
  it("수식으로 시작하는 답은 ' 로 막는다 (엑셀 수식 주입 방지)", () => {
    const csv = applyCsv([apply]);
    expect(csv).toContain("\"'=내가 먼저\"");
    expect(csv).not.toContain('"=내가 먼저"');
  });
});
