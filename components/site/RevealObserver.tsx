"use client";

import { useEffect } from "react";

/**
 * 스크롤 등장 효과. `data-reveal`(떠오름)·`data-fold`(종이 펼침)·`.img-live`(사진 가라앉기 폴백) 요소가 화면에 들어오면 `is-in` 을 붙인다 (한 번만).
 * CSS(globals.css)는 html.js 가 있을 때만 숨기므로 JS 가 꺼져 있으면 모두 그대로 보인다.
 * 페이지 이동으로 새로 생긴 요소는 MutationObserver 로 잡는다.
 * 또 iOS Safari 는 touchstart 리스너가 있어야 터치에 :active 를 적용하므로, 빈 리스너를 하나 달아 사진·카드 누름 효과를 켠다.
 */
const WATCH = ["[data-reveal]", "[data-fold]", ".img-live"];

export function RevealObserver() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("js");
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const watch = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(`${WATCH.map((w) => `${w}:not(.is-in)`).join(", ")}`).forEach((el) => {
        if (reduce) el.classList.add("is-in");
        else io.observe(el);
      });
    };
    watch(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) { if (n.matches(WATCH.join(", "))) watch(n.parentNode ?? document); else watch(n); } });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); document.removeEventListener("touchstart", noop); html.classList.remove("js"); };
  }, []);
  return null;
}
