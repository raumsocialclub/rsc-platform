import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown, groupImages, parseMarkdown } from "@/components/Markdown";
import { byName, imageLine, MAX_W, planSlices, SLICE_H } from "@/lib/posts/images";

describe("소식 본문 사진 — 긴 사진 조각 계산 (planSlices)", () => {
  it("가로가 작은 사진은 줄이지 않고 한 조각", () => {
    const p = planSlices(1200, 3000);
    expect(p.scale).toBe(1);
    expect(p.width).toBe(1200);
    expect(p.slices).toEqual([{ sy: 0, sh: 3000, dh: 3000 }]);
  });
  it("가로만 MAX_W 로 맞추고 세로는 비율대로 — 세로 때문에 가로가 작아지지 않는다", () => {
    const p = planSlices(3200, 20000);
    expect(p.width).toBe(MAX_W);
    expect(p.height).toBe(10000);
    expect(p.slices.length).toBe(Math.ceil(10000 / SLICE_H));
  });
  it("조각은 빈틈·겹침 없이 원본 전체를 덮고, 축소 후 높이 합이 전체와 같다", () => {
    for (const [w, h] of [[1080, 13000], [1600, 8001], [2400, 9999], [1200, SLICE_H]]) {
      const p = planSlices(w, h);
      let sy = 0, dh = 0;
      for (const s of p.slices) { expect(s.sy).toBe(sy); expect(s.sh).toBeGreaterThan(0); expect(s.dh).toBeGreaterThan(0); expect(s.dh).toBeLessThanOrEqual(SLICE_H + 1); sy += s.sh; dh += s.dh; }
      expect(sy).toBe(h);
      expect(dh).toBe(p.height);
    }
  });
  it("파일 이름 자연 정렬(01, 2, 10)과 사진 줄 형식(캡션 없음)", () => {
    const names = [{ name: "상세_10.jpg" }, { name: "상세_2.jpg" }, { name: "상세_01.jpg" }].sort(byName).map((f) => f.name);
    expect(names).toEqual(["상세_01.jpg", "상세_2.jpg", "상세_10.jpg"]);
    expect(imageLine("https://x/a.webp")).toBe("![](https://x/a.webp)");
  });
});

describe("소식 본문 사진 — 공개 화면 렌더", () => {
  const md = "소개\n\n![](https://cdn/a.webp)\n![](https://cdn/b.webp)\n![설명](https://cdn/c.webp)\n\n중간 글\n\n![](/d.png)\n\n![x](javascript:alert(1))";
  it("붙어 있는 사진 줄은 한 묶음, 빈 줄로 나뉘면 다른 묶음", () => {
    const g = groupImages(parseMarkdown(md));
    expect(g.map((b) => b.t)).toEqual(["p", "imgs", "p", "imgs"]); // javascript: 줄은 사진으로 인식되지 않아 버려진다
    expect((g[1] as { items: unknown[] }).items).toHaveLength(3);
    // 사진만 있는 글: 빈 줄로 띄운 두 장은 두 묶음, 붙여 쓴 두 장은 한 묶음
    expect(groupImages(parseMarkdown("![](/a.png)\n\n![](/b.png)")).length).toBe(2);
    expect(groupImages(parseMarkdown("![](/a.png)\n![](/b.png)")).length).toBe(1);
  });
  it("고정 비율·object-cover 없이 원본 비율(w-full h-auto)로, 묶음 안에서는 틈 없이 이어 붙인다", () => {
    const html = renderToStaticMarkup(React.createElement(Markdown, { source: md }));
    expect(html).not.toContain("aspect-");
    expect(html).not.toContain("object-cover");
    expect(html.match(/<img /g)).toHaveLength(4);
    expect(html).toContain('<img src="https://cdn/a.webp" alt="" loading="lazy"');
    // 글 맨 앞이 사진이면 첫 장만 바로 불러온다
    expect(renderToStaticMarkup(React.createElement(Markdown, { source: "![](/a.png)\n![](/b.png)" }))).toMatch(/a\.png" alt="" loading="eager".*b\.png" alt="" loading="lazy"/);
    expect(html).toContain('<img src="https://cdn/b.webp" alt="" loading="lazy"');
    // 묶음 안: a 와 b 사이에 아무 요소도 없다
    expect(html).toMatch(/a\.webp"[^>]*\/><img src="https:\/\/cdn\/b\.webp"/);
    // 설명이 있는 조각만 캡션
    expect(html.match(/<figcaption/g)).toHaveLength(1);
    expect(html).toContain(">설명</figcaption>");
    // 위험한 주소는 버린다
    expect(html).not.toContain("javascript:");
    expect(html.match(/<figure /g)).toHaveLength(2);
  });
});
