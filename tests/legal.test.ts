import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LEGAL_UPDATED, PRIVACY, PRIVACY_CONSENT_VERSION, REFUND, TERMS } from "@/lib/legal/content";
import { DOC_BY_ID } from "@/lib/cms/schema";
import { mergeDoc } from "@/lib/cms/get";

const text = (list: { title: string; body: string[] }[]) => list.map((s) => [s.title, ...s.body].join("\n")).join("\n");
const articles = (list: { title: string }[]) => list.map((s) => /^제(\d+)조/.exec(s.title)?.[1]).filter(Boolean).map(Number);

/** 2026-11-27 소셜클럽 멤버십 버전 약관·방침 (1:1 매칭 제외) */
describe("이용약관 · 개인정보처리방침 (소셜클럽 멤버십 버전)", () => {
  it("게시·시행일과 동의 버전이 2026-11-27 로 맞고, 부칙·개정 이력 조는 두지 않는다(날짜만 게시)", () => {
    expect(PRIVACY_CONSENT_VERSION).toBe("2026-11-27");
    expect(LEGAL_UPDATED).toBe("2026년 11월 27일");
    for (const doc of [TERMS, PRIVACY, REFUND]) expect(doc.some((s) => /부칙|개정 이력/.test(s.title))).toBe(false);
    expect(readFileSync("components/legal/LegalPage.tsx", "utf8")).toContain("게시 · 시행일 {updated}");
  });

  it("본문 어디에도 1:1 매칭 표현이 없고, 소개·주선을 하지 않음을 밝힌다", () => {
    for (const doc of [TERMS, PRIVACY, REFUND]) expect(text(doc)).not.toContain("1:1 매칭");
    expect(text(TERMS)).toContain("결혼중개업이 아니며 1:1 소개 서비스를 제공하지 않습니다");
    expect(text(PRIVACY)).toContain("소개·주선하는 서비스를 제공하지 않으며");
  });

  it("이용약관에 멤버십 핵심 조항(자격·심사, 기간·가입비, 행사, 초대권, 환불, 초상권)이 있다", () => {
    const titles = TERMS.map((s) => s.title).join("\n");
    for (const t of ["가입 자격과 심사", "가입 승인과 멤버십의 성립", "멤버십 기간·가입비·갱신", "행사의 신청·참가·참가비", "지인 초대권", "제휴 혜택·주차·공간 대관", "멤버의 의무와 금지행위", "이용 제한과 멤버십의 종료", "청약철회·해지·환불", "행사 사진·초상권과 지식재산권"]) expect(titles).toContain(t);
    const body = text(TERMS);
    expect(body).toContain("회원 자격 기간은 1년입니다");
    expect(body).toContain("자동 갱신이나 정기 결제는 없습니다");
    expect(body).toContain("사본을 보관하지 않습니다");
    expect(body).toContain("납부한 가입비의 10%");
    expect(body).toContain("행사일 3일 전까지 취소");
  });

  it("개인정보처리방침이 실제 처리(채널톡·상담 콜 시트·제휴문의·참여 신청·멤버 정보)를 다루고 자동화된 결정이 없음을 밝힌다", () => {
    const body = text(PRIVACY);
    for (const k of ["주식회사 채널코퍼레이션", "Google LLC", "제휴문의", "행사 참여 신청", "멤버 정보", "동반 지인", "차량번호", "Meta 픽셀", "Supabase, Inc.", "Vercel, Inc.", "자동화된 결정", "유출 등"]) expect(body).toContain(k);
    expect(body).toContain("멤버십이 종료(만료·해지·자격 상실)된 날부터 1년");
    expect(body).toContain("고유식별정보를 수집·보관하지 않습니다");
  });

  it("조 번호가 1부터 빠짐없이 이어지고, 본문의 '제N조' 참조가 존재하는 조를 가리킨다", () => {
    for (const doc of [TERMS, PRIVACY]) {
      const nums = articles(doc);
      expect(nums).toEqual(nums.map((_, i) => i + 1));
      // 「…법률」 제17조 처럼 법령 조문을 가리키는 참조는 제외하고, 이 문서 안의 조를 가리키는 참조만 본다
      const refs = [...text(doc).matchAll(/(?<!(?:법|법률|고시|시행령)」?\s|조·)제(\d+)조/g)].map((m) => Number(m[1]));
      for (const n of refs) expect(n).toBeLessThanOrEqual(nums.length);
    }
  });

  it("CMS 약관 문서의 기본 시행일과 조항이 코드 기본값을 따른다", () => {
    for (const k of ["terms", "privacy"] as const) {
      const def = DOC_BY_ID.get(`legal.${k}`)!;
      expect(def.defaults.updated).toBe(LEGAL_UPDATED);
      const merged = mergeDoc(def, null);
      expect((merged.sections as unknown[]).length).toBe((k === "terms" ? TERMS : PRIVACY).length);
    }
  });
});
