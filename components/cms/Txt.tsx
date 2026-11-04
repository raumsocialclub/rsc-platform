import { Fragment } from "react";

/**
 * CMS·안내 문구 렌더러.
 * - 마침표·물음표·느낌표로 문장이 끝나면 다음 문장을 항상 새 줄에 놓는다 (PC·모바일 공통, 문장이 중간에 잘려 보이지 않게).
 *   숫자 뒤의 점("1. 항목", "10.5")은 문장 끝으로 보지 않는다.
 * - "\n" 은 soft(기본): 데스크톱에서만 줄바꿈(모바일은 띄어쓰기 한 칸으로 이어 붙임), hard: 항상 줄바꿈.
 *   단, 줄 끝이 문장 끝이면 soft 라도 항상 줄을 바꾼다.
 */
const SENTENCE_END = /([^\d\s][.!?。])\s+(?=\S)/g;
type Br = "hard" | "soft" | "none";

export function sentences(line: string): string[] {
  return line.replace(SENTENCE_END, "$1\u0000").split("\u0000");
}

export function Txt({ v, breaks = "soft" }: { v: string | undefined | null; breaks?: "soft" | "hard" }) {
  const lines = String(v ?? "").split("\n");
  const parts: { text: string; br: Br }[] = [];
  lines.forEach((line, li) => {
    const ss = sentences(line);
    // 줄 끝이 문장 끝(마침표 등)이면 다음 줄은 새 문장이므로 soft 라도 항상 줄을 바꾼다
    const endsSentence = /[^\d\s][.!?。]\s*$/.test(line);
    ss.forEach((text, si) => parts.push({ text, br: si < ss.length - 1 ? "hard" : li < lines.length - 1 ? (breaks === "soft" && endsSentence ? "hard" : breaks) : "none" }));
  });
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p.text}
          {p.br === "hard" && <br />}
          {p.br === "soft" && <> <br className="hidden md:inline" /></>}
        </Fragment>
      ))}
    </>
  );
}

/** 줄 단위 배열 */
export function lines(v: unknown): string[] {
  return String(v ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
}
