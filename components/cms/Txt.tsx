import { Fragment, type ReactNode } from "react";

/**
 * CMS·안내 문구 렌더러.
 * - 마침표·물음표·느낌표로 문장이 끝나면 다음 문장을 항상 새 줄에 놓는다 (PC·모바일 공통, 문장이 중간에 잘려 보이지 않게).
 *   숫자 뒤의 점("1. 항목", "10.5")은 문장 끝으로 보지 않는다.
 * - "\n" 은 soft(기본): 데스크톱에서만 줄바꿈(모바일은 띄어쓰기 한 칸으로 이어 붙임), hard: 항상 줄바꿈.
 *   단, 줄 끝이 문장 끝이면 soft 라도 항상 줄을 바꾼다.
 * - 고유명사(RSC TASTE SOCIAL, RAUM SOLO …)와 가운뎃점 목록(아트·와인·웰니스)은 줄 중간에서 끊기지 않게 한 덩어리로 묶는다.
 */
const SENTENCE_END = /([^\d\s][.!?。])\s+(?=\S)/g;
type Br = "hard" | "soft" | "none";

/** 줄바꿈 없이 붙여 둘 고유명사 (긴 것 먼저) */
const TERMS = [
  "RSC GRAND SOCIAL BALL", "GRAND SOCIAL BALL", "RAUM SOCIAL NIGHT", "RSC TASTE SOCIAL", "TASTE SOCIAL", "SOCIAL NIGHT",
  "RAUM SOCIAL CLUB", "RAUM ART WALK", "ONE QUESTION SALON", "RAUM AFTER HOURS", "SUNDAY RESET", "TASTE TABLE", "RUN & BRUNCH",
  "PRIVATE CONNECTION", "Relationship Concierge", "Relationship Director", "Second Date Benefit", "Founding Member", "Private Choice",
  "RAUM WEDDING", "RAUM ORIGIN", "RAUM MERRY", "RAUM CLASSIC", "RAUM SIGNATURE", "RAUM PRIVÉ", "RAUM SOLO", "SOLO BALL", "SIGNATURE", "CLASSIC", "PRIVÉ", "PREVIEW", "ACCESS", "1:1 매칭", "1:1 만남", "1:1 소개",
];
const TERM_RE = new RegExp(`(${TERMERS()})`, "g");
function TERMERS() { return TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"); }
/** "아트·와인·웰니스·러닝" 처럼 가운뎃점으로 이어진 묶음 */
const DOT_RE = /([^\s·]+(?:·[^\s·]+)+)/g;

/** 한 문장 안에서 고유명사·가운뎃점 묶음을 nowrap 으로 감싼다 */
export function nowrap(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(`${TERM_RE.source}|${DOT_RE.source}`, "g");
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span key={k++} className="whitespace-nowrap">{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

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
          {nowrap(p.text)}
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
