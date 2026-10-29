"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/** 런타임 오류 경계 (레이아웃 안). 서버 컴포넌트 예외·데이터 조회 실패 시 표시. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/error]", error);
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center px-[18px] py-[80px]">
      <div className="max-w-[560px] w-full text-center">
        <div className="text-[11px] tracking-[.3em] text-[rgba(33,30,25,.5)] mb-[18px]">ERROR</div>
        <h1 className="font-medium text-[28px] md:text-[36px] leading-[1.3] mb-[14px]">문제가 생겼습니다</h1>
        <p className="text-[14.5px] leading-[1.7] text-[rgba(33,30,25,.65)] mb-[8px]">일시적인 오류일 수 있습니다. 다시 시도해도 반복되면 고객센터(02-538-3366)로 알려 주세요.</p>
        {error.digest && <p className="text-[12px] text-[rgba(33,30,25,.45)] mb-[28px]">오류 코드: {error.digest}</p>}
        <div className="flex gap-[10px] justify-center flex-wrap mt-[20px]">
          <button type="button" onClick={reset} className="px-[28px] py-[16px] bg-brown text-cream hover:bg-brownHover text-[13.5px] font-semibold border-0 cursor-pointer">다시 시도</button>
          <Link href="/" className="px-[28px] py-[16px] border border-brown text-brown text-[13.5px] font-semibold">첫 화면으로</Link>
        </div>
      </div>
    </div>
  );
}
