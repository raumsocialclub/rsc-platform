import { describe, expect, it } from "vitest";
import { searchDocs } from "@/lib/cms/search";
import { DOCS } from "@/lib/cms/schema";
import { mergeDoc } from "@/lib/cms/get";

const all = Object.fromEntries(DOCS.map((d) => [d.id, mergeDoc(d, null)]));

describe("어드민 문구 검색 (searchDocs)", () => {
  it("사이트에 보이는 문장으로 섹션을 찾는다", () => {
    const hits = searchDocs(all, "아무나, 들어올 수 없습니다");
    // 소셜클럽·1:1 매칭 페이지가 각각 자기 문서를 가지므로 둘 다 찾혀야 한다
    expect(hits.some((h) => h.docId === "social.verify" && h.pageLabel === "소셜클럽")).toBe(true);
    expect(hits.some((h) => h.docId === "matching.verify" && h.pageLabel === "1:1 매칭")).toBe(true);
  });
  it("목록 항목(FAQ 답변) 안의 문장도 찾고 몇 번째 항목인지 알려준다", () => {
    const hits = searchDocs(all, "Founding Member 선착순 100명");
    const faq = hits.find((h) => h.docId === "home.faq");
    expect(faq).toBeDefined();
    expect(faq!.field).toMatch(/^질문 \d+ · 답변$/);
  });
  it("대소문자·줄바꿈을 무시하고, 숨긴 문서는 제외한다", () => {
    expect(searchDocs(all, "raum social club").length).toBeGreaterThan(0);
    const hidden = DOCS.filter((d) => d.hidden).map((d) => d.id);
    expect(hidden.length).toBeGreaterThan(0);
    for (const h of searchDocs(all, "멤버십")) expect(hidden).not.toContain(h.docId);
  });
  it("빈 검색어는 결과가 없다", () => {
    expect(searchDocs(all, "   ")).toEqual([]);
  });
});
