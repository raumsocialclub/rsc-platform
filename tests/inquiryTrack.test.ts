import { describe, expect, it } from "vitest";
import { cleanEntryPath, entryLabel, entryPathFromReferrer, inquiryTrack, matchesTrack, parseTrackFilter, trackLabel } from "@/lib/inquiries/track";
import { toLeadRow } from "@/lib/admin/leads";

/** 상담 신청의 관심 방식·들어온 경로 (가상 데이터) */
const row = (answers: Record<string, unknown> | null) => ({ answers: answers as never });

describe("관심 방식 (inquiryTrack)", () => {
  it("새 신청은 track 키로, 예전 신청은 route 라벨로 되짚는다", () => {
    expect(inquiryTrack(row({ track: "matching", route: "1:1 매칭" }))).toBe("matching");
    expect(trackLabel(row({ track: "social" }))).toBe("소셜클럽");
    expect(inquiryTrack(row({ route: "상담 후 결정" }))).toBe("undecided");
    expect(inquiryTrack(row({ route: "소셜클럽" }))).toBe("social");
  });
  it("설문형(/apply) 응답과 인연 경로(인스타그램)는 방식이 없다", () => {
    expect(inquiryTrack(row({ form: "apply", route: "소셜클럽 지인" }))).toBeNull();
    expect(inquiryTrack(row({ route: "인스타그램" }))).toBeNull();
    expect(trackLabel(row(null))).toBe("");
  });
  it("필터: 전체 · 방식 · 기록 없음", () => {
    const social = row({ track: "social" }), none = row({ route: "인스타그램" });
    expect(matchesTrack(social, "")).toBe(true);
    expect(matchesTrack(social, "social")).toBe(true);
    expect(matchesTrack(social, "matching")).toBe(false);
    expect(matchesTrack(none, "-")).toBe(true);
    expect(matchesTrack(social, "-")).toBe(false);
    expect(parseTrackFilter("matching")).toBe("matching");
    expect(parseTrackFilter("x")).toBe("");
  });
});

describe("들어온 경로 (entryLabel)", () => {
  it("직전 페이지와 어느 상담 버튼을 눌렀는지 보여준다", () => {
    expect(entryLabel(row({ track: "matching", entryTrack: "matching", entryPath: "/matching" }))).toBe("1:1 매칭 페이지 · 1:1 매칭 상담 버튼");
    expect(entryLabel(row({ track: "social", entryTrack: "social", entryPath: "/" }))).toBe("메인 · 소셜클럽 상담 버튼");
    expect(entryLabel(row({ track: "undecided", entryPath: "/news/2026-11-event" }))).toBe("소식");
    expect(entryLabel(row({ track: "undecided", entryPath: "ext:instagram.com" }))).toBe("외부 링크 (instagram.com)");
    expect(entryLabel(row({ track: "undecided" }))).toBe("직접 접속 · 링크");
    expect(entryLabel(row({ route: "인스타그램" }))).toBe("");
  });
  it("브라우저 referrer → 같은 사이트는 경로, 다른 사이트는 ext:호스트", () => {
    expect(entryPathFromReferrer("https://rsc-platform.vercel.app/social?x=1", "https://rsc-platform.vercel.app")).toBe("/social");
    expect(entryPathFromReferrer("https://l.instagram.com/?u=...", "https://rsc-platform.vercel.app")).toBe("ext:l.instagram.com");
    expect(entryPathFromReferrer("", "https://rsc-platform.vercel.app")).toBe("");
    expect(entryPathFromReferrer("not a url", "https://rsc-platform.vercel.app")).toBe("");
  });
  it("서버 저장 전 정리: 경로·ext:호스트 꼴만 남긴다", () => {
    expect(cleanEntryPath("/matching")).toBe("/matching");
    expect(cleanEntryPath("ext:instagram.com")).toBe("ext:instagram.com");
    expect(cleanEntryPath("javascript:alert(1)")).toBe("");
    expect(cleanEntryPath("<script>")).toBe("");
    expect(cleanEntryPath(123)).toBe("");
  });
  it("CSV 에 관심 방식·들어온 경로 열이 들어간다", () => {
    const r = toLeadRow({ id: "inq-9", name: "테스트", phone: "010-1111-2222", created_at: "2026-11-09T01:00:00.000Z", utm: null, answers: { track: "social", entryTrack: "social", entryPath: "/social" } as never });
    expect(r.interest).toBe("소셜클럽");
    expect(r.entry).toBe("소셜클럽 페이지 · 소셜클럽 상담 버튼");
  });
});
