"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/ds";

/** 런타임 오류 경계 (레이아웃 안). 서버 컴포넌트 예외·데이터 조회 실패 시 표시. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/error]", error);
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center px-[20px] py-[80px]">
      <div className="max-w-[480px] w-full text-center">
        <div className="t-label-1 font-semibold text-negativeFg mb-[10px]">오류</div>
        <h1 className="t-title-2 text-label mb-[12px]">문제가 생겼습니다</h1>
        <p className="t-body-1-reading text-labelAlt mb-[6px]">일시적인 오류일 수 있습니다. 다시 시도해도 반복되면 고객센터(02-6925-4786)로 알려 주세요.</p>
        {error.digest && <p className="t-caption-1 text-labelAssist mb-[20px]">오류 코드: {error.digest}</p>}
        <div className="flex gap-[10px] justify-center flex-wrap mt-[20px]">
          <Button onClick={reset} size="lg">다시 시도</Button>
          <ButtonLink href="/" variant="assistive" size="lg">첫 화면으로</ButtonLink>
        </div>
      </div>
    </div>
  );
}
