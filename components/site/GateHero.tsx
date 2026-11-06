"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Txt } from "@/components/cms/Txt";
import { btn } from "@/components/ui/ds";

export type GateTrack = {
  key: "social" | "matching";
  tab: string;
  image: string;
  overline: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  applyHref: string;
};

/**
 * 메인 게이트 히어로: 「소셜클럽 | 1:1 매칭」 전환 탭이 달린 사진 카드.
 * 탭·키보드(←/→)·모바일 스와이프로 트랙을 바꾸면 사진·문구·버튼이 함께 바뀐다. 각 트랙의 버튼은 /social·/matching 과 상담 신청(?track=)으로 간다.
 * 레퍼런스: emotional oranges 홈의 로테이션/프라이빗 전환 히어로. 사진은 두 장을 모두 미리 그려 두고 opacity 로 교차한다(깜빡임 없음).
 */
export function GateHero({ tracks, defaultTrack, applyLabel }: { tracks: GateTrack[]; defaultTrack: GateTrack["key"]; applyLabel: string }) {
  const start = Math.max(0, tracks.findIndex((t) => t.key === defaultTrack));
  const [i, setI] = useState(start);
  const touch = useRef<number | null>(null);
  const go = useCallback((n: number) => setI(((n % tracks.length) + tracks.length) % tracks.length), [tracks.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    const el = document.getElementById("gate-hero");
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, [i, go]);
  const cur = tracks[i];
  if (!cur) return null;

  return (
    <section
      id="gate-hero"
      tabIndex={-1}
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-ds bg-inverseBg text-inverseLabel min-h-[520px] md:min-h-[600px] lg:min-h-[640px] flex flex-col anim-zoom outline-none"
      onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const x0 = touch.current, x1 = e.changedTouches[0]?.clientX;
        touch.current = null;
        if (x0 == null || x1 == null || Math.abs(x1 - x0) < 48) return;
        go(x1 < x0 ? i + 1 : i - 1);
      }}
    >
      {/* 배경 사진 (두 장 모두 그려 두고 교차) */}
      {tracks.map((t, k) => (
        <div key={t.key} aria-hidden className={`absolute inset-0 transition-opacity duration-700 ease-out ${k === i ? "opacity-100" : "opacity-0"}`}>
          <Image src={t.image} alt="" fill priority={k === start} sizes="(min-width: 1200px) 1200px, 100vw" className={`object-cover transition-transform duration-[1400ms] ease-out ${k === i ? "scale-100" : "scale-[1.06]"}`} unoptimized={t.image.startsWith("http")} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.28)_0%,rgba(0,0,0,.18)_35%,rgba(0,0,0,.72)_100%)]" />
        </div>
      ))}

      {/* 전환 탭 */}
      <div className="relative z-10 p-[16px] md:p-[24px] flex items-start justify-between gap-[12px]">
        <div role="tablist" aria-label="만남 방식 선택" className="inline-flex p-[4px] rounded-pill bg-white/90 backdrop-blur-[10px] shadow-[0_6px_20px_rgba(0,0,0,.18)]">
          {tracks.map((t, k) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={k === i}
              onClick={() => go(k)}
              className={`h-[36px] md:h-[40px] px-[16px] md:px-[20px] rounded-pill t-label-1 md:text-[15px] font-semibold cursor-pointer border-0 transition-[background-color,color,transform] duration-200 active:scale-[.97] ${k === i ? "bg-primary text-white shadow-[0_4px_12px_rgba(0,102,255,.35)]" : "bg-transparent text-labelNeutral hover:text-label"}`}
            >
              {t.tab}
            </button>
          ))}
        </div>
        <div className="hidden md:block t-label-2 text-white/70 tabular-nums pt-[10px]">{i + 1} / {tracks.length}</div>
      </div>

      {/* 문구 */}
      <div className="relative z-10 mt-auto p-[20px] pb-[24px] md:p-[48px] md:pb-[48px] max-w-[720px]">
        <div key={cur.key} className="anim-up">
          <div className="t-eyebrow text-white/80 mb-[12px]">{cur.overline}</div>
          <h1 className="t-title-1 md:t-display-2 lg:t-display-1 text-white text-pretty mb-[14px] md:mb-[18px]"><Txt v={cur.title} breaks="hard" /></h1>
          <p className="t-body-1-reading md:text-[18px] md:leading-[1.6] text-white/85 text-pretty max-w-[560px] mb-[24px] md:mb-[32px]"><Txt v={cur.body} /></p>
          <div className="flex gap-[10px] flex-wrap">
            <Link href={cur.href} className={btn("inverse", "lg")}>{cur.cta}</Link>
            <Link href={cur.applyHref} className={btn("solid", "lg")}>{applyLabel}</Link>
          </div>
        </div>
      </div>

      {/* 모바일 점 표시 */}
      <div className="md:hidden relative z-10 flex gap-[6px] justify-center pb-[16px]" aria-hidden>
        {tracks.map((t, k) => <span key={t.key} className={`h-[6px] rounded-pill transition-[width,background-color] duration-300 ${k === i ? "w-[22px] bg-white" : "w-[6px] bg-white/45"}`} />)}
      </div>
    </section>
  );
}
