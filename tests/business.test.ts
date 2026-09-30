import { describe, expect, it } from "vitest";
import { businessInfo, businessLine } from "@/lib/site/business";

describe("사업자 정보 표시", () => {
  it("정식 상호가 없으면 아무것도 표시하지 않는다", () => {
    expect(businessInfo({ bizRep: "홍길동", bizNumber: "000-00-00000", address: "서울" })).toEqual([]);
    expect(businessLine({})).toBe("");
  });
  it("채운 항목만 순서대로 표시하고, 사업장 주소가 없으면 푸터 주소를 쓴다", () => {
    const b = { bizName: "주식회사 예시", bizRep: "홍길동", bizNumber: "000-00-00000", bizMailOrder: "", address: "서울특별시 강남구 언주로 564\n(역삼동 680-1)" };
    expect(businessInfo(b).map((i) => i.label)).toEqual(["상호", "대표자", "사업자등록번호", "주소"]);
    expect(businessLine(b)).toBe("상호 주식회사 예시 · 대표자 홍길동 · 사업자등록번호 000-00-00000 · 주소 서울특별시 강남구 언주로 564 (역삼동 680-1)");
  });
  it("통신판매업 신고번호와 사업장 주소를 채우면 그대로 표시한다", () => {
    const line = businessLine({ bizName: "주식회사 예시", bizMailOrder: "제2026-서울강남-0000호", bizAddress: "서울 강남구 A로 1", address: "다른 주소" });
    expect(line).toContain("통신판매업 신고번호 제2026-서울강남-0000호");
    expect(line).toContain("주소 서울 강남구 A로 1");
    expect(line).not.toContain("다른 주소");
  });
});
