import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * 소식 본문용 작은 마크다운 렌더러 (의존성 없음, HTML 태그는 렌더하지 않음 → XSS 안전).
 * 지원: # ## ### 제목, 문단(빈 줄로 구분, 줄바꿈 유지), - 목록, 1. 목록, > 인용, --- 구분선,
 *      ![설명](이미지주소), **굵게**, *기울임*, [문구](링크)
 */

const H = { 1: "font-semibold text-[26px] md:text-[32px] leading-[1.3] mt-[48px] mb-[18px] text-pretty", 2: "font-semibold text-[22px] md:text-[26px] leading-[1.35] mt-[44px] mb-[16px] text-pretty", 3: "font-semibold text-[18px] md:text-[20px] leading-[1.4] mt-[32px] mb-[12px]" } as const;
const P = "text-[15.5px] md:text-[16.5px] leading-[1.85] text-[rgba(46,47,51,.88)] mb-[22px] text-pretty";

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[2]) out.push(<strong key={k} className="font-semibold text-label">{m[2]}</strong>);
    else if (m[4]) out.push(<em key={k}>{m[4]}</em>);
    else if (m[6] && m[7]) {
      const href = m[7];
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/.test(href);
      if (!safe) out.push(m[6]);
      else if (href.startsWith("/")) out.push(<Link key={k} href={href} className="underline text-primary hover:text-primaryStrong">{m[6]}</Link>);
      else out.push(<a key={k} href={href} target="_blank" rel="noreferrer" className="underline text-primary hover:text-primaryStrong">{m[6]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(lines: string[], keyBase: string): ReactNode[] {
  return lines.flatMap((l, i) => (i === 0 ? inline(l, `${keyBase}-${i}`) : [<br key={`${keyBase}-br-${i}`} />, ...inline(l, `${keyBase}-${i}`)]));
}

/** img.gap: 바로 앞 사진 줄과 빈 줄로 띄어 썼다 → 공개 화면에서 이어 붙이지 않고 따로 보여 준다 */
type Block = { t: "h"; level: 1 | 2 | 3; text: string } | { t: "p"; lines: string[] } | { t: "ul"; items: string[] } | { t: "ol"; items: string[] } | { t: "q"; lines: string[] } | { t: "hr" } | { t: "img"; alt: string; src: string; gap: boolean };

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let blank = false; // 직전 줄이 빈 줄이었는지(사진 줄 묶음 판정용)
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { blank = true; i++; continue; }
    const gap = blank;
    blank = false;
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) { blocks.push({ t: "h", level: h[1].length as 1 | 2 | 3, text: h[2] }); i++; continue; }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) { blocks.push({ t: "hr" }); i++; continue; }
    const im = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (im) { blocks.push({ t: "img", alt: im[1], src: im[2], gap }); i++; continue; }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, "")); i++; }
      blocks.push({ t: "ul", items });
      continue;
    }
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+[.)]\s+/, "")); i++; }
      blocks.push({ t: "ol", items });
      continue;
    }
    if (trimmed.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      blocks.push({ t: "q", lines: q });
      continue;
    }
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|[-*]\s|\d+[.)]\s|>|!\[|-{3,}$)/.test(lines[i].trim())) { p.push(lines[i].trim()); i++; }
    if (p.length) blocks.push({ t: "p", lines: p });
    else i++;
  }
  return blocks;
}

/** 붙어 있는 사진 줄(빈 줄 없이 연속)은 한 묶음으로 → 공개 화면에서 틈 없이 이어져 긴 상세 페이지 한 장처럼 보인다. 빈 줄로 띄우면 따로 */
export function groupImages(blocks: Block[]): (Block | { t: "imgs"; items: { alt: string; src: string }[] })[] {
  const out: (Block | { t: "imgs"; items: { alt: string; src: string }[] })[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.t === "img" && !b.gap && last?.t === "imgs") { last.items.push({ alt: b.alt, src: b.src }); continue; }
    out.push(b.t === "img" ? { t: "imgs", items: [{ alt: b.alt, src: b.src }] } : b);
  }
  return out;
}

const SAFE_SRC = /^(https?:\/\/|\/)/;

export function Markdown({ source }: { source: string }) {
  const blocks = groupImages(parseMarkdown(source));
  return (
    <div>
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.t) {
          case "h": {
            const cls = H[b.level];
            if (b.level === 1) return <h2 key={k} className={cls}>{inline(b.text, k)}</h2>;
            if (b.level === 2) return <h2 key={k} className={cls}>{inline(b.text, k)}</h2>;
            return <h3 key={k} className={cls}>{inline(b.text, k)}</h3>;
          }
          case "p": return <p key={k} className={P}>{withBreaks(b.lines, k)}</p>;
          case "ul": return <ul key={k} className={`${P} list-disc pl-[22px]`}>{b.items.map((it, j) => <li key={j} className="mb-[6px]">{inline(it, `${k}-${j}`)}</li>)}</ul>;
          case "ol": return <ol key={k} className={`${P} list-decimal pl-[22px]`}>{b.items.map((it, j) => <li key={j} className="mb-[6px]">{inline(it, `${k}-${j}`)}</li>)}</ol>;
          case "q": return <blockquote key={k} className="border-l-2 border-brownHover pl-[24px] py-[4px] my-[32px] text-[16px] md:text-[17px] leading-[1.7] text-label text-pretty">{withBreaks(b.lines, k)}</blockquote>;
          case "hr": return <hr key={k} className="border-0 border-t border-[rgba(112,115,124,.16)] my-[40px]" />;
          case "img": return <Fragment key={k} />; // groupImages 가 모두 imgs 로 바꾼다
          case "imgs": {
            const items = b.items.filter((it) => SAFE_SRC.test(it.src));
            if (!items.length) return <Fragment key={k} />;
            return (
              <figure key={k} className="my-[32px]">
                {/* 원본 비율 그대로(세로로 긴 상세 페이지 이미지 포함) — 고정 비율 상자·object-cover 로 잘라내지 않는다.
                    여러 조각은 block 으로 세로로 붙여 틈이 없다. 설명(alt)이 있는 조각만 그 아래 캡션 */}
                {items.map((it, j) => (
                  <Fragment key={j}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.src} alt={it.alt} loading={i === 0 && j === 0 ? "eager" : "lazy"} decoding="async" className="block w-full h-auto bg-[#f4f4f5]" />
                    {it.alt && <figcaption className="text-[13px] text-[rgba(55,56,60,.61)] mt-[10px] mb-[18px] text-center">{it.alt}</figcaption>}
                  </Fragment>
                ))}
              </figure>
            );
          }
        }
      })}
    </div>
  );
}
