import { describe, expect, it } from "vitest";
import { EDUCATION_OPTIONS, JOB_OPTIONS, REGION_OPTIONS, profileRows, residenceLabel } from "@/lib/inquiries/profile";

/** 상담 신청 추가 항목(직업·학력·거주지) 선택지와 어드민 표시 */
describe("상담 신청 직업·학력·거주지 선택지", () => {
  it("직업 9종 · 학력 10종 · 시/도 15종(충청·전라·경상은 남북 합침, 해외 포함)이고 중복이 없다", () => {
    expect(JOB_OPTIONS.length).toBe(9);
    expect(EDUCATION_OPTIONS.length).toBe(10);
    expect(REGION_OPTIONS.length).toBe(15);
    expect(JOB_OPTIONS[0]).toBe("대기업");
    expect(JOB_OPTIONS.at(-1)).toBe("기타");
    expect(EDUCATION_OPTIONS).toContain("고등학교 졸업");
    expect(REGION_OPTIONS).toContain("전라도");
    expect(REGION_OPTIONS).not.toContain("전라북도");
    expect(REGION_OPTIONS.at(-1)).toBe("해외");
    for (const list of [JOB_OPTIONS, EDUCATION_OPTIONS, REGION_OPTIONS]) expect(new Set(list).size).toBe(list.length);
  });
  it("거주지 한 줄: 시/도 + 시/군/구, 시/군/구가 없으면 시/도만, 둘 다 없으면 빈 문자열", () => {
    expect(residenceLabel({ region: "서울특별시", district: "송파구" })).toBe("서울특별시 송파구");
    expect(residenceLabel({ region: "해외" })).toBe("해외");
    expect(residenceLabel({ region: "해외", district: "  " })).toBe("해외");
    expect(residenceLabel(null)).toBe("");
  });
  it("어드민 상세 행은 값이 있는 항목만, 직업 → 학력 → 거주지 순", () => {
    expect(profileRows({ job: "자영업", education: "대학(2, 3년제) 졸업", region: "부산광역시", district: "해운대구" })).toEqual([
      { q: "직업", a: "자영업" }, { q: "학력", a: "대학(2, 3년제) 졸업" }, { q: "거주지", a: "부산광역시 해운대구" },
    ]);
    expect(profileRows({ region: "경기도" })).toEqual([{ q: "거주지", a: "경기도" }]);
    expect(profileRows({})).toEqual([]);
  });
});
