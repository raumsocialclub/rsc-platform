import { describe, expect, it } from "vitest";
import { DOC_BY_ID } from "@/lib/cms/schema";

/** 멤버 기준표 (2026-11-20): 소셜클럽 가입 심사 섹션 아래 항목별 「기준보기」 표 — CMS 기본값만 확인 */
describe("멤버 기준표 (social.verify.criteria)", () => {
  it("소셜클럽 문서에 9개 기준(제목·기준·제출 서류)과 표시 스위치·버튼 문구가 있고, 1:1 매칭 문서에는 없다", () => {
    const d = DOC_BY_ID.get("social.verify")!;
    const criteria = d.defaults.criteria as { title: string; standard: string; docs: string }[];
    expect(criteria.map((c) => c.title)).toEqual(["전문직", "공공 · 교육", "대기업 · 언론 · 금융", "사업가", "학력", "셀럽", "고소득", "부동산", "금융자산"]);
    for (const c of criteria) { expect(c.standard.length).toBeGreaterThan(5); expect(c.docs.length).toBeGreaterThan(5); }
    expect(d.defaults.criteriaVisible).toBe(true);
    expect(d.defaults.criteriaButton).toBe("기준보기");
    expect(d.lists?.some((l) => l.key === "criteria" && l.fields.map((f) => f.key).join() === "title,standard,docs")).toBe(true);
    expect(d.fields.some((f) => f.key === "criteriaVisible" && f.type === "boolean")).toBe(true);
    const m = DOC_BY_ID.get("matching.verify")!;
    expect(m.defaults.criteria).toBeUndefined();
    expect(m.lists?.some((l) => l.key === "criteria")).toBeFalsy();
  });
});
