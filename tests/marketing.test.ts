import { describe, expect, it } from "vitest";
import { reconfirmDue, reconfirmSoon, trackKo, type MarketingConsentRow } from "@/lib/inquiries/marketing";
import { MARKETING_CSV_COLUMNS, marketingCsv, marketingCsvRow } from "@/lib/admin/marketingCsv";

/** 마케팅 수신 동의: 재확인 예정일(2년) 계산과 어드민 CSV (가상 데이터) */
const row: MarketingConsentRow = { id: "m-1", inquiry_id: "inq-1", name: "홍길동", phone: "010-1234-5678", region: "서울특별시", track: "matching", channels: "전화, 문자, 카카오톡", consent_at: "2026-11-12T01:01:08.000Z", consent_version: "2026-11-12", withdrawn_at: null, withdrawn_by: null, created_at: "2026-11-12T01:01:08.000Z" };

describe("마케팅 수신 동의", () => {
  it("재확인 예정일은 동의일 + 2년, 30일 안이면 확인 필요", () => {
    expect(reconfirmDue(row.consent_at)).toBe("2028-11-12T01:01:08.000Z");
    expect(reconfirmSoon(row.consent_at, new Date("2027-01-01T00:00:00Z"))).toBe(false);
    expect(reconfirmSoon(row.consent_at, new Date("2028-10-20T00:00:00Z"))).toBe(true);
    expect(reconfirmSoon(row.consent_at, new Date("2029-01-01T00:00:00Z"))).toBe(true);
  });
  it("CSV: 열 순서와 값(한국 시각), 철회 행은 상태·철회 일시", () => {
    expect([...MARKETING_CSV_COLUMNS]).toEqual(["이름", "휴대폰", "거주지역", "관심 방식", "동의 일시", "동의문 버전", "수신 방법", "재확인 예정일", "상태", "철회 일시", "상담 신청 ID"]);
    expect(marketingCsvRow(row)).toEqual(["홍길동", "010-1234-5678", "서울특별시", "1:1 매칭", "2026-11-12T10:01:08+09:00", "2026-11-12", "전화, 문자, 카카오톡", "2028-11-12", "동의", "", "inq-1"]);
    const wd = marketingCsvRow({ ...row, withdrawn_at: "2027-03-01T05:00:00.000Z", inquiry_id: null, track: null });
    expect(wd.slice(8)).toEqual(["철회", "2027-03-01T14:00:00+09:00", ""]);
    expect(wd[3]).toBe("");
    const csv = marketingCsv([row]);
    expect(csv.startsWith("﻿\"이름\"")).toBe(true);
    expect(csv.split("\r\n")[1]).toContain('"홍길동"');
  });
  it("관심 방식 키 → 한글", () => {
    expect(trackKo("social")).toBe("소셜클럽");
    expect(trackKo("x")).toBe("");
  });
});
