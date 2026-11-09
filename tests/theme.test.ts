import { describe, expect, it } from "vitest";
import { hexToRgb } from "@/lib/cms/get";

/** 색상 테마 → CSS 변수 (가상 값) */
describe("색상 테마 hexToRgb", () => {
  it("6자리 hex 를 r,g,b 로 바꾼다", () => {
    expect(hexToRgb("#4d1b20")).toBe("77,27,32");
    expect(hexToRgb("#FFFFFF")).toBe("255,255,255");
  });
  it("형식이 틀리면 기본 파랑", () => {
    expect(hexToRgb("blue")).toBe("0,102,255");
    expect(hexToRgb("#fff")).toBe("0,102,255");
  });
});
