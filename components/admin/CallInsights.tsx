"use client";

import { useMemo, useState } from "react";
import { CARD, FIELD, Badge } from "./ui";
import { badgeStyle } from "@/lib/admin/format";
import type { InsightReport, Tag, ThemeKey } from "@/lib/crm/insights";
import { STATUS_KO, type CallStatus } from "@/lib/crm/types";

const statusBadge = (s: CallStatus) => badgeStyle(s === "done" ? "ok" : s === "callback" ? "warn" : s === "invalid" || s === "declined" ? "bad" : "mute");
const THEME_COLOR: Record<ThemeKey, string> = { interest: "#5a3d24", activity: "#2e6b3e", schedule: "#7a5420", experience: "#4a5a8a", budget: "#a3402c", profile: "#6b6b6b", followup: "#8a4a7a" };

/**
 * 인터뷰 니즈 분석 (M18-2): 시트 셀 노트(노란 말풍선)와 「인터뷰 내용」 칸의 문장을 주제별로 태그해 한눈에.
 * 왼쪽 주제 카드의 태그를 누르면 오른쪽 고객 카드가 그 태그로 걸러진다. 원문은 항상 그대로 보여준다.
 */
export function CallInsights({ r }: { r: InsightReport }) {
  const [sel, setSel] = useState<Tag | null>(null);
  const [q, setQ] = useState("");
  const [showUntagged, setShowUntagged] = useState(false);
  const customers = useMemo(() => {
    const needle = q.trim();
    return r.customers.filter((c) => (!sel || c.tags.some((t) => t.theme === sel.theme && t.tag === sel.tag)) && (!needle || c.name.includes(needle) || c.lines.some((l) => l.includes(needle)) || c.memo.includes(needle)));
  }, [r.customers, sel, q]);
  const pick = (t: Tag) => setSel(sel && sel.theme === t.theme && sel.tag === t.tag ? null : t);

  return (
    <div className="mb-[24px]">
      <div className="flex items-baseline justify-between gap-[12px] flex-wrap mb-[12px]">
        <div><b className="text-[15px]">인터뷰 니즈 분석</b> <span className="text-[12.5px] text-[rgba(33,30,25,.55)]">노트·인터뷰 내용이 있는 고객 {r.interviewed}명 · 문장 {r.lineCount}개 · 태그를 누르면 해당 고객만 보입니다</span></div>
        {sel && <button type="button" onClick={() => setSel(null)} className="text-[12.5px] underline bg-transparent border-0 cursor-pointer text-brown">「{sel.tag}」 필터 해제</button>}
      </div>
      {r.interviewed === 0 ? (
        <div className={`${CARD} p-[22px] text-[13px] text-[rgba(33,30,25,.55)]`}>아직 인터뷰 노트가 없습니다. 시트의 콜 결과 칸에 노트(마우스 오른쪽 → 메모 삽입)로 상담 내용을 적으면 여기에 주제별로 모입니다. Apps Script 를 노트까지 읽는 새 버전으로 다시 배포했는지도 확인해 주세요.</div>
      ) : (
        <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-[16px]">
          <div className="grid grid-cols-1 min-[761px]:grid-cols-2 gap-[12px] content-start">
            {r.themes.map((t) => (
              <div key={t.theme} className={`${CARD} p-[16px]`}>
                <div className="flex justify-between items-baseline mb-[10px]">
                  <b className="text-[13.5px]" style={{ color: THEME_COLOR[t.theme] }}>{t.label}</b>
                  <span className="text-[11.5px] text-[rgba(33,30,25,.45)]">{t.hint}</span>
                </div>
                {t.tags.length === 0 ? <div className="text-[12.5px] text-[rgba(33,30,25,.45)]">언급 없음</div> : (
                  <ul className="m-0 p-0 list-none grid gap-[6px]">
                    {t.tags.map((x) => {
                      const on = sel?.theme === t.theme && sel.tag === x.tag;
                      const w = Math.max(4, Math.round((x.count / Math.max(1, r.interviewed)) * 100));
                      return (
                        <li key={x.tag}>
                          <button type="button" onClick={() => pick({ theme: t.theme, tag: x.tag })} title={x.samples.join("\n")} className="w-full text-left bg-transparent border-0 p-0 cursor-pointer" style={{ fontWeight: on ? 600 : 400 }}>
                            <div className="flex justify-between text-[12.5px] mb-[3px]"><span>{x.tag}</span><span className="text-[rgba(33,30,25,.5)]">{x.count}명</span></div>
                            <div className="h-[6px] bg-[rgba(33,30,25,.06)]"><div className="h-full" style={{ width: `${w}%`, background: on ? THEME_COLOR[t.theme] : "#c9b79a" }} /></div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
            {r.untagged.length > 0 && (
              <div className={`${CARD} p-[16px] min-[761px]:col-span-2`}>
                <button type="button" onClick={() => setShowUntagged((v) => !v)} className="bg-transparent border-0 p-0 cursor-pointer text-[12.5px] text-[rgba(33,30,25,.6)]">
                  분류 규칙에 안 걸린 문장 {r.untagged.length}개 {showUntagged ? "접기 ▲" : "펼치기 ▼"}
                </button>
                {showUntagged && (
                  <ul className="m-0 mt-[8px] p-0 list-none grid gap-[4px] max-h-[220px] overflow-y-auto text-[12.5px]">
                    {r.untagged.map((u, i) => <li key={i}><span className="text-[rgba(33,30,25,.5)]">{u.name} · </span>{u.line}</li>)}
                  </ul>
                )}
                <div className="text-[11.5px] text-[rgba(33,30,25,.45)] mt-[6px]">자주 나오는 표현이 있으면 알려주시면 분류 규칙에 추가합니다.</div>
              </div>
            )}
          </div>

          <div className={`${CARD} flex flex-col min-h-[320px]`}>
            <div className="flex items-center gap-[10px] p-[14px] border-b border-[rgba(33,30,25,.1)]">
              <b className="text-[13.5px]">고객별 인터뷰</b>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·내용 검색" className={`${FIELD} !w-[180px] !py-[7px]`} />
              <span className="text-[12px] text-[rgba(33,30,25,.5)] ml-auto">{customers.length}명</span>
            </div>
            <ul className="m-0 p-0 list-none overflow-y-auto max-h-[640px]">
              {customers.length === 0 && <li className="p-[24px] text-center text-[13px] text-[rgba(33,30,25,.5)]">조건에 맞는 고객이 없습니다.</li>}
              {customers.map((c) => (
                <li key={c.key} className="p-[14px] border-b border-[rgba(33,30,25,.08)]">
                  <div className="flex items-center gap-[8px] flex-wrap mb-[6px]">
                    <b className="text-[13.5px]">{c.name || "(이름 없음)"}</b>
                    <span className="text-[12px] text-[rgba(33,30,25,.5)]">{c.tab}</span>
                    <Badge style={statusBadge(c.status)}>{STATUS_KO[c.status]}</Badge>
                    {c.memo && <span className="text-[12px] text-[#7a5420]">· {c.memo}</span>}
                  </div>
                  {c.tags.length > 0 && (
                    <div className="flex flex-wrap gap-[4px] mb-[6px]">
                      {c.tags.map((t) => <button key={`${t.theme}|${t.tag}`} type="button" onClick={() => pick(t)} className="border-0 cursor-pointer text-[11px] px-[7px] py-[2px]" style={{ background: sel?.theme === t.theme && sel.tag === t.tag ? THEME_COLOR[t.theme] : "rgba(33,30,25,.06)", color: sel?.theme === t.theme && sel.tag === t.tag ? "#f7f3ec" : THEME_COLOR[t.theme] }}>{t.tag}</button>)}
                    </div>
                  )}
                  {c.lines.length > 0 && <ul className="m-0 pl-[16px] text-[12.5px] leading-[1.6] text-[rgba(33,30,25,.8)]">{c.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
