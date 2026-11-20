import { describe, expect, it } from "vitest";
import { filterMonth, fmtPostDate, monthsOf, parseYM, pickDefaultMonth, postMonth, yearOptions } from "@/lib/posts/calendar";

const P = (event_date: string | null, published_at: string | null, id = "x") => ({ id, event_date, published_at });

describe("소식 월별 탭", () => {
  it("행사 일자가 있으면 그 달, 없으면 발행일(KST)로 분류한다", () => {
    expect(postMonth(P("2026-10-15", "2026-09-30T12:00:00Z"))).toEqual({ y: 2026, m: 10 });
    // UTC 9/30 23:00 = KST 10/1 08:00
    expect(postMonth(P(null, "2026-09-30T23:00:00Z"))).toEqual({ y: 2026, m: 10 });
    expect(postMonth(P(null, null))).toBeNull();
  });
  it("글이 있는 달 목록은 연도 내림차순·월 오름차순", () => {
    const months = monthsOf([P("2026-10-02", null), P("2026-10-15", null), P("2025-12-01", null), P(null, "2026-03-05T00:00:00Z")]);
    expect(months).toEqual([{ y: 2026, m: 3 }, { y: 2026, m: 10 }, { y: 2025, m: 12 }]);
    expect(yearOptions(months, { y: 2027, m: 1 })).toEqual([2027, 2026, 2025]);
  });
  it("기본 달: 이번 달에 글이 있으면 이번 달, 없으면 가장 가까운 달(같은 거리면 다가오는 달)", () => {
    const months = [{ y: 2026, m: 8 }, { y: 2026, m: 10 }, { y: 2026, m: 12 }];
    expect(pickDefaultMonth(months, { y: 2026, m: 10 })).toEqual({ y: 2026, m: 10 });
    expect(pickDefaultMonth(months, { y: 2026, m: 9 })).toEqual({ y: 2026, m: 10 });
    expect(pickDefaultMonth(months, { y: 2026, m: 11 })).toEqual({ y: 2026, m: 12 });
    expect(pickDefaultMonth(months, { y: 2027, m: 3 })).toEqual({ y: 2026, m: 12 });
    expect(pickDefaultMonth([], { y: 2026, m: 9 })).toEqual({ y: 2026, m: 9 });
  });
  it("그 달의 글만 행사 일자 순으로 고른다", () => {
    const list = [P("2026-10-15", null, "b"), P("2026-11-01", null, "c"), P("2026-10-02", null, "a"), P(null, "2026-10-20T03:00:00Z", "d")];
    expect(filterMonth(list, { y: 2026, m: 10 }).map((p) => p.id)).toEqual(["a", "b", "d"]);
  });
  it("주소의 연·월 값을 검사하고 날짜를 요일과 함께 표시한다", () => {
    expect(parseYM("2026", "10")).toEqual({ y: 2026, m: 10 });
    expect(parseYM("2026", "13")).toBeNull();
    expect(parseYM(undefined, undefined)).toBeNull();
    expect(fmtPostDate(P("2026-10-02", null))).toBe("2026.10.02 (금)");
    expect(fmtPostDate(P("2026-10-15", null))).toBe("2026.10.15 (목)");
  });
});
