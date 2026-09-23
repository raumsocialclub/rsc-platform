import { Fragment } from "react";

/**
 * CMS 문자열 렌더러. "\n" 을 줄바꿈으로 바꾼다.
 * soft: 데스크톱에서만 줄바꿈(프로토타입 <br class="lb">), hard: 항상 줄바꿈.
 */
export function Txt({ v, breaks = "soft" }: { v: string | undefined | null; breaks?: "soft" | "hard" }) {
  const lines = String(v ?? "").split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br className={breaks === "soft" ? "hidden md:inline" : undefined} />}
        </Fragment>
      ))}
    </>
  );
}

/** 줄 단위 배열 */
export function lines(v: unknown): string[] {
  return String(v ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}
