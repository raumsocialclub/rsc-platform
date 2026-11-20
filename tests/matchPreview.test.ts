import { describe, expect, it } from "vitest";
import { PREREG_HREF, PREREG_SRC, dropMatchingSegments, llmsPreview, mentionsMatching, scrubDoc, stripMatching, stripMatchingText } from "@/lib/settings/matchPreview";
import { SEO_DOCS } from "@/lib/seo/schema";
import { SETTINGS_DOCS } from "@/lib/settings/schema";
import { DOC_BY_ID } from "@/lib/cms/schema";

/** 1:1 매칭 사전등록 모드 (2026-11-20 정책): 상세 숨김 규칙과 llms.txt 정리. 전부 기본 문구·가상 문구로 확인 */
describe("1:1 매칭 사전등록 모드", () => {
  it("설정 기본값은 켬, 사전등록 링크는 /match-check?src=prereg, 티저 문서(matching.preview)가 있다", () => {
    const site = SETTINGS_DOCS.find((d) => d.id === "settings.site")!;
    expect(site.defaults.matchPreview).toBe(true);
    expect(site.fields.some((f) => f.key === "matchPreview" && f.type === "boolean")).toBe(true);
    expect(PREREG_SRC).toBe("prereg");
    expect(PREREG_HREF).toBe("/match-check?src=prereg");
    const pv = DOC_BY_ID.get("matching.preview")!;
    expect(pv.page).toBe("matching");
    expect(pv.defaults.ctaLabel).toBe("사전등록하기");
    expect(String(pv.defaults.points).split("\n")).toHaveLength(3);
    const form = DOC_BY_ID.get("match.form")!;
    expect(form.defaults.preregTitle).toBe("1:1 매칭 사전등록");
  });
  it("mentionsMatching: 1:1 · 플랜명 · /matching 링크를 잡는다", () => {
    expect(mentionsMatching("소셜클럽으로 시작한 뒤, 1:1 매칭 멤버십으로 전환")).toBe(true);
    expect(mentionsMatching("RAUM CLASSIC · SIGNATURE · PRIVÉ")).toBe(true);
    expect(mentionsMatching("자세한 내용은 /matching 에서")).toBe(true);
    expect(mentionsMatching("가입 자격은 법률상 배우자가 없는 싱글입니다.")).toBe(false);
    expect(mentionsMatching("")).toBe(false);
  });
  it("stripMatching: 「…과 1:1 매칭 …」 짝만 지우고 나머지 문장은 그대로", () => {
    expect(stripMatching("임직원 복지로 소셜클럽 멤버십과 1:1 매칭 상담을 제공합니다. 기업 맞춤 소셜 프로그램도 기획합니다.")).toBe("임직원 복지로 소셜클럽 멤버십 상담을 제공합니다. 기업 맞춤 소셜 프로그램도 기획합니다.");
    expect(stripMatching("소셜클럽과 1:1 매칭 가입이 궁금하시면 상담을 신청해 주세요.")).toBe("소셜클럽 가입이 궁금하시면 상담을 신청해 주세요.");
    expect(stripMatching("1:1 매칭과 소셜클럽 모두 상담은 무료입니다.")).toBe("소셜클럽 모두 상담은 무료입니다.");
    expect(stripMatching("브랜드·콘텐츠 협업을 기다립니다.")).toBe("브랜드·콘텐츠 협업을 기다립니다.");
  });
  it("stripMatchingText: 문장·절 단위로 1:1 매칭 언급만 빼고, scrubDoc 은 문서 전체(목록 포함)에 적용한다", () => {
    expect(stripMatchingText("관계: 결혼중개가 아닌 커뮤니티. 원하면 연회비만 더해 1:1 매칭으로 전환")).toBe("관계: 결혼중개가 아닌 커뮤니티.");
    expect(stripMatchingText("가입비 하나로 1년 회원 자격을 받습니다. 결혼중개가 아니므로 특정 상대를 소개하지 않으며, 원할 때 연회비만 더해 1:1 매칭으로 전환합니다.")).toBe("가입비 하나로 1년 회원 자격을 받습니다. 결혼중개가 아니므로 특정 상대를 소개하지 않습니다.");
    expect(stripMatchingText("대상: 싱글\n방식: 월 1회 행사\n관계: 커뮤니티. 원하면 1:1 매칭으로 전환")).toBe("대상: 싱글\n방식: 월 1회 행사\n관계: 커뮤니티.");
    expect(stripMatchingText("소셜클럽과 1:1 매칭 가입이 궁금하시면 상담을 신청해 주세요.")).toBe("소셜클럽 가입이 궁금하시면 상담을 신청해 주세요.");
    expect(stripMatchingText("취향으로 만나는 커뮤니티입니다.")).toBe("취향으로 만나는 커뮤니티입니다.");
    const tracksDoc = DOC_BY_ID.get("home.tracks")!.defaults as Record<string, unknown>;
    const scrubbed = scrubDoc(tracksDoc);
    expect(String(scrubbed.socialPoints)).not.toMatch(/1:1/);
    expect(String(scrubbed.socialPoints)).toMatch(/관계: 결혼중개가 아닌 커뮤니티\./);
    expect(String(scrubbed.lead)).toBe(String(tracksDoc.lead));
    expect(scrubDoc(tracksDoc, false)).toBe(tracksDoc);
    const mem = DOC_BY_ID.get("social.membership")!.defaults as Record<string, unknown>;
    const m2 = scrubDoc(mem);
    expect(String(m2.lead)).not.toMatch(/1:1/);
    expect((m2.items as unknown[]).length).toBe((mem.items as unknown[]).length - 1); // 04 UPGRADE(1:1 매칭으로 전환) 항목이 빠진다
  });
  it("dropMatchingSegments: 「 · 」 조각 중 매칭 조각만 뺀다", () => {
    expect(dropMatchingSegments("- 멤버십: 소셜클럽(가입비 · 1년) · 1:1 매칭(결혼중개) RAUM CLASSIC 4,400,000원")).toBe("- 멤버십: 소셜클럽(가입비 · 1년)");
    expect(dropMatchingSegments("- 프로그램: 월 1회 TASTE SOCIAL · 1:1 매칭 회원 전용 RAUM SOCIAL NIGHT · 1:1 매칭 회원 RAUM SOLO")).toBe("- 프로그램: 월 1회 TASTE SOCIAL");
    expect(dropMatchingSegments("- 문의: 02-0000-0000")).toBe("- 문의: 02-0000-0000");
    expect(dropMatchingSegments("- 1:1 매칭: 어쩌구")).toBe("");
  });
  it("llmsPreview: 기본 llms.txt 본문에서 플랜·가입비·회원 행사가 사라지고 사전등록 안내 줄이 들어간다", () => {
    const ai = SEO_DOCS.find((d) => d.id === "seo.ai")!;
    const before = String(ai.defaults.llmsText);
    expect(before).toMatch(/RAUM CLASSIC/);
    const after = llmsPreview(before);
    expect(after).not.toMatch(/RAUM CLASSIC|SIGNATURE|PRIVÉ|SOCIAL NIGHT|RAUM SOLO|4,400,000/);
    expect(after).toMatch(/소셜클럽\(\/social/);
    expect(after).not.toMatch(/두 가지 방식으로/);
    expect(after).toMatch(/사전등록\(\/matching → \/match-check 프로필 설문\)만 받습니다/);
    expect(after).toMatch(/- 운영: 주식회사 트라움에스앤씨/);
    expect(after).toMatch(/- 가입: /);
    expect(after).toMatch(/- 프로그램: 월 1회 RSC TASTE SOCIAL/);
  });
});
