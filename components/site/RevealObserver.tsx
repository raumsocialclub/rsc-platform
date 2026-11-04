"use client";

import { useEffect } from "react";

/**
 * 스크롤 등장 효과. `data-reveal`(떠오름)·`data-fold`(종이 펼침) 요소가 화면에 들어오면 `is-in` 을 붙인다 (한 번만).
 * CSS(globals.css)는 html.js 가 있을 때만 숨기므로 JS 가 꺼져 있으면 모두 그대로 보인다.
 * 페이지 이동으로 새로 생긴 요소는 MutationObserver 로 잡는다.
 */
export function RevealObserver() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("js");
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
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in), [data-fold]:not(.is-in)").forEach((el) => {
        if (reduce) el.classList.add("is-in");
        else io.observe(el);
      });
    };
    watch(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) { if (n.matches("[data-reveal], [data-fold]")) watch(n.parentNode ?? document); else watch(n); } });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); html.classList.remove("js"); };
  }, []);
  return null;
}
