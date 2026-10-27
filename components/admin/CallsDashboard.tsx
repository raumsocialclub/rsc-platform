"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CallInsights } from "./CallInsights";
import { BTN_SECONDARY, CARD, FIELD, TH, TD as TD0, Badge, EmptyRow, PageTitle } from "./ui";
import { badgeStyle } from "@/lib/admin/format";
import { CHANNEL_KO, FIELD_KO, STATUS_KO, STATUS_ORDER, type CallLead, type CallStatus, type CallsData, type Channel, type TabSummary } from "@/lib/crm/types";
import { fmtFull, fmtTime, kstParts } from "@/lib/programs/format";

const TD = `${TD0} px-[10px]`;
const POLL_MS = 30_000;
const STATUS_FILTER: ("all" | CallStatus)[] = ["all", ...STATUS_ORDER];
const CHANNEL_FILTER: { k: "all" | Channel; l: string }[] = [{ k: "all", l: "모든 채널" }, { k: "web", l: "홈페이지" }, { k: "meta", l: "메타" }, { k: "", l: "채널 미상" }];
const channelKo = (c: Channel) => (c ? CHANNEL_KO[c] : "채널 미상");

const statusBadge = (s: CallStatus) =>
  badgeStyle(s === "done" ? "ok" : s === "callback" ? "warn" : s === "invalid" || s === "declined" ? "bad" : s === "pending" ? "mute" : "mute");

/** "10.26 14:03" · 오늘이면 "14:03" */
function shortWhen(iso: string | null): string {
  if (!iso) return "—";
  const p = kstParts(iso);
  const n = kstParts(new Date().toISOString());
  return p.y === n.y && p.m === n.m && p.d === n.d ? fmtTime(iso) : `${p.m}.${p.d} ${fmtTime(iso)}`;
}
function ago(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

/**
 * 콜 현황 대시보드 (M18). 서버가 넘긴 첫 데이터를 보여주고 30초마다 /api/admin/crm-calls 로 갱신한다(탭이 보일 때만).
 * KPI → 인터뷰 니즈 분석 → 콜 단계·탭별 진행 → 최근 변경·인터뷰 내용 요약 → 전체 목록(필터) 순서의 한 페이지.
 */
export function CallsDashboard({ initial, initialError }: { initial: CallsData | null; initialError: string | null }) {
  const [data, setData] = useState<CallsData | null>(initial);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(true);
  const [tab, setTab] = useState<string>("all");
  const [channel, setChannel] = useState<"all" | Channel>("all");
  const [status, setStatus] = useState<"all" | CallStatus>("all");
  const [q, setQ] = useState("");
  const [, tick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/crm-calls", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as (CallsData & { stale?: boolean; message?: string }) | { ok: false; message?: string } | null;
      if (!res.ok || !json || !json.ok) throw new Error((json && "message" in json && json.message) || "시트를 읽지 못했습니다.");
      setData(json);
      setError(json.stale ? json.message ?? "시트를 읽지 못해 마지막 내용을 보여줍니다." : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "시트를 읽지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    const run = () => { if (document.visibilityState === "visible") void refresh(); };
    timer.current = setInterval(run, POLL_MS);
    document.addEventListener("visibilitychange", run);
    return () => { if (timer.current) clearInterval(timer.current); document.removeEventListener("visibilitychange", run); };
  }, [auto, refresh]);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 15_000); return () => clearInterval(t); }, []);

  const leads = useMemo(() => data?.leads ?? [], [data]);
  const rows = useMemo(() => {
    const needle = q.trim().replace(/-/g, "");
    return leads.filter((l) => (tab === "all" || l.tabs.includes(tab)) && (channel === "all" || l.channel === channel) && (status === "all" || l.status === status) && (!needle || l.name.includes(needle) || l.phone.replace(/-/g, "").includes(needle) || l.memo.includes(needle) || l.note.includes(needle) || l.calls.some((c) => c.includes(needle))));
  }, [leads, tab, channel, status, q]);

  const pickChannel = (label: string) => {
    const k = (Object.keys(CHANNEL_KO) as Exclude<Channel, "">[]).find((c) => CHANNEL_KO[c] === label) ?? "";
    setChannel((cur) => (cur === k ? "all" : k));
  };

  const s = data?.summary;
  const pct = (n: number) => (s && s.total ? `${Math.round((n / s.total) * 100)}%` : "0%");
  const cards = s
    ? [
        { label: "전체 신청", value: `${s.total}명`, sub: s.rows > s.total ? `신청 ${s.submissions}건 · 중복 ${s.rows - s.total}행 합침` : `시트 탭 ${data?.tabs.length ?? 0}개` },
        { label: "통화완료", value: `${s.byStatus.done}건`, sub: pct(s.byStatus.done), color: "#2e6b3e" },
        { label: "재통화 예정", value: `${s.byStatus.callback}건`, sub: "시간 약속·문자 요청", color: "#7a5420" },
        { label: "부재중", value: `${s.byStatus.missed}건`, sub: `${s.attempts[3]}건은 3차까지 시도` },
        { label: "없는 번호 · 거절", value: `${s.byStatus.invalid + s.byStatus.declined}건`, sub: `없는 번호 ${s.byStatus.invalid} · 거절 ${s.byStatus.declined}`, color: "#a3402c" },
        { label: "미진행", value: `${s.byStatus.pending}건`, sub: "아직 1차 콜 전", color: s.byStatus.pending ? "#7a5420" : undefined },
      ]
    : [];

  return (
    <>
      <PageTitle overline="CALL TRACKING" title="콜 현황" aside={<span className="text-[13px] font-normal text-[rgba(33,30,25,.5)]">구글 시트 실시간</span>}>
        <div className="flex items-center gap-[10px] flex-wrap text-[12.5px]">
          <span className="text-[rgba(33,30,25,.55)]">{data ? `갱신 ${fmtTime(data.fetchedAt)}:${String(new Date(data.fetchedAt).getSeconds()).padStart(2, "0")}` : "아직 읽지 못함"}</span>
          <label className="flex items-center gap-[6px] cursor-pointer"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-brown" />30초마다 자동 갱신</label>
          <button type="button" onClick={() => void refresh()} disabled={busy} className={BTN_SECONDARY}>{busy ? "읽는 중…" : "지금 새로고침"}</button>
          {data?.sheetUrl && <a href={data.sheetUrl} target="_blank" rel="noreferrer" className={BTN_SECONDARY}>시트 열기 ↗</a>}
          {data && <span className="text-[rgba(33,30,25,.55)]">{data.sheet.notesSupported ? `셀 노트 ${data.sheet.noteCount}개 수신` : "셀 노트 미수신"}</span>}
        </div>
      </PageTitle>

      {data && !data.sheet.notesSupported && (
        <div className="mb-[18px] rounded-[10px] border border-[#e0b96a] bg-[#fff7e3] px-[16px] py-[12px] text-[13px] text-[#6b4a00]">
          <b>Apps Script 가 구버전이라 셀 노트(노란 말풍선)를 받지 못하고 있습니다.</b> 시트 → 확장 프로그램 → Apps Script 에서 <code>deploy/crm-sheet-webapp.gs</code> 최신 내용을 붙여 넣고 저장한 뒤, 배포 → 배포 관리 → 연필 → 버전 「새 버전」 → 배포를 누르면 (주소는 그대로) 다음 갱신부터 노트가 들어옵니다.
        </div>
      )}

      {error && (
        <div className="mb-[20px] px-[18px] py-[14px] text-[13px]" style={{ background: "rgba(163,64,44,.08)", color: "#a3402c", border: "1px solid rgba(163,64,44,.25)" }}>
          시트를 읽지 못했습니다: {error}{data ? " — 마지막으로 읽은 내용을 보여주고 있습니다." : ""}
        </div>
      )}

      {s && (
        <div className="grid grid-cols-2 min-[1201px]:grid-cols-6 gap-[12px] mb-[24px]">
          {cards.map((c) => (
            <div key={c.label} className={`${CARD} px-[20px] py-[18px]`}>
              <div className="text-[11.5px] tracking-[.08em] text-[rgba(33,30,25,.5)] mb-[10px]">{c.label}</div>
              <div className="text-[clamp(18px,1.5vw,24px)] font-semibold whitespace-nowrap">{c.value}</div>
              <div className="text-[12px] mt-[6px]" style={{ color: c.color ?? "rgba(33,30,25,.55)" }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {data && <CallInsights r={data.insights} />}

      {s && (
        <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-[16px] mb-[24px]">
          <div className={`${CARD} p-[22px]`}>
            <b className="text-[14px] block mb-[16px]">콜 시도 단계</b>
            {([0, 1, 2, 3] as const).map((n) => {
              const v = s.attempts[n];
              return (
                <div key={n} className="flex items-center gap-[12px] mb-[10px] text-[13px]">
                  <span className="w-[72px] text-[rgba(33,30,25,.6)]">{n === 0 ? "시도 전" : `${n}차까지`}</span>
                  <div className="flex-1 h-[10px] bg-[rgba(33,30,25,.06)]"><div className="h-full" style={{ width: `${s.total ? Math.max(v ? 2 : 0, Math.round((v / s.total) * 100)) : 0}%`, background: n === 0 ? "#c9b79a" : "#5a3d24" }} /></div>
                  <span className="w-[64px] text-right">{v}건 <span className="text-[rgba(33,30,25,.45)]">{pct(v)}</span></span>
                </div>
              );
            })}
            <div className="text-[12px] text-[rgba(33,30,25,.5)] mt-[14px]">인터뷰 내용 칸이 적힌 신청 {s.withMemo}건 · 노트가 있는 고객 {data?.insights.interviewed ?? 0}명</div>
          </div>
          <div className="grid gap-[16px]">
          <div className={`${CARD} overflow-x-auto`}>
            <table className="w-full border-collapse">
              <thead><tr><th className={TH}>{data?.sheet.masterTab ? "수집 채널" : "시트 탭"}</th><th className={TH}>전체</th><th className={TH}>통화완료</th><th className={TH}>재통화</th><th className={TH}>부재중</th><th className={TH}>없는 번호</th><th className={TH}>미진행</th><th className={TH}>완료율</th></tr></thead>
              <tbody>
                {(data?.sheet.masterTab ? s.byChannel : s.byTab).map((t: TabSummary) => (
                  <tr key={t.tab} className="cursor-pointer hover:bg-[rgba(33,30,25,.03)]" onClick={() => (data?.sheet.masterTab ? pickChannel(t.tab) : setTab(tab === t.tab ? "all" : t.tab))} style={{ background: (data?.sheet.masterTab ? channelKo(channel as Channel) === t.tab && channel !== "all" : tab === t.tab) ? "rgba(90,61,36,.06)" : undefined }}>
                    <td className={`${TD} font-medium`}>{t.tab}</td><td className={TD}>{t.total}</td><td className={TD} style={{ color: "#2e6b3e" }}>{t.done}</td><td className={TD}>{t.callback}</td><td className={TD}>{t.missed}</td><td className={TD} style={{ color: t.invalid ? "#a3402c" : undefined }}>{t.invalid}</td><td className={TD}>{t.pending}</td>
                    <td className={TD}>{t.total ? Math.round((t.done / t.total) * 100) : 0}%</td>
                  </tr>
                ))}
                {s.byTab.length === 0 && <EmptyRow colSpan={8}>시트에 신청 행이 없습니다.</EmptyRow>}
              </tbody>
            </table>
            {data && (data.sheet.masterTab || data.sheet.statusTab || s.resubmitted > 0 || s.crossChannel > 0) && (
              <div className="px-[14px] py-[10px] text-[12px] text-[rgba(33,30,25,.55)] border-t border-[rgba(33,30,25,.08)]">
                {data.sheet.masterTab ? `신청은 「${data.sheet.masterTab}」 탭 기준` : "시트 탭을 모두 읽음"}
                {data.sheet.statusTab ? ` · 콜 결과·메모는 「${data.sheet.statusTab}」 탭 기준` : ""}
                {` · 전화번호가 같으면 한 사람 (두 번 이상 신청 ${s.resubmitted}명 · 홈페이지·메타 양쪽 ${s.crossChannel}명)`}
                {data.sheet.ignoredTabs.length ? ` · 수식 탭 제외: ${data.sheet.ignoredTabs.join(", ")}` : ""}
              </div>
            )}
          </div>
          <div className={`${CARD} overflow-x-auto`}>
            <table className="w-full border-collapse">
              <thead><tr><th className={TH}>신청일 (최근 14일)</th><th className={TH}>신청</th><th className={TH}>홈페이지</th><th className={TH}>메타</th><th className={TH}>처음 신청</th><th className={TH}>재신청</th></tr></thead>
              <tbody>
                {s.byDay.map((d) => (
                  <tr key={d.day}>
                    <td className={`${TD} font-medium`}>{d.day.slice(5).replace("-", ".")}</td><td className={TD}>{d.total}</td><td className={TD}>{d.web}</td><td className={TD}>{d.meta}</td><td className={TD}>{d.fresh}</td><td className={TD} style={{ color: d.again ? "#7a5420" : undefined }}>{d.again}</td>
                  </tr>
                ))}
                {s.byDay.length === 0 && <EmptyRow colSpan={6}>최근 14일 신청이 없습니다.</EmptyRow>}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 min-[1201px]:grid-cols-2 gap-[16px] mb-[24px]">
          <div className={`${CARD} p-[22px]`}>
            <div className="flex justify-between items-baseline mb-[14px]"><b className="text-[14px]">최근 변경</b><span className="text-[12px] text-[rgba(33,30,25,.5)]">{data.eventsEnabled ? "시트 칸이 바뀔 때마다 기록 · 30일 보관" : "변경 기록 꺼짐 (서버 키 없음)"}</span></div>
            {data.events.length === 0 ? (
              <div className="text-[13px] text-[rgba(33,30,25,.5)]">{data.eventsEnabled ? "아직 기록된 변경이 없습니다. 시트에 콜 결과를 적으면 여기에 쌓입니다." : "—"}</div>
            ) : (
              <ul className="m-0 p-0 list-none max-h-[360px] overflow-y-auto grid gap-[8px]">
                {data.events.map((e) => (
                  <li key={e.id} className="text-[13px] flex gap-[10px] items-start border-b border-[rgba(33,30,25,.06)] pb-[8px]">
                    <span className="text-[11.5px] text-[rgba(33,30,25,.45)] whitespace-nowrap w-[56px] pt-[2px]" title={fmtFull(e.at)}>{ago(e.at)}</span>
                    <span className="min-w-0">
                      <b>{e.name || "(이름 없음)"}</b> <span className="text-[rgba(33,30,25,.5)]">· {e.tab} · {FIELD_KO[e.field]}</span><br />
                      {e.field === "new" ? <span>새 신청이 시트에 들어왔습니다{e.after ? ` (${e.after})` : ""}</span> : <span>{e.before ? <><s className="text-[rgba(33,30,25,.45)]">{e.before}</s> → </> : ""}<span className="font-medium">{e.after || "(지움)"}</span></span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={`${CARD} p-[22px]`}>
            <div className="flex justify-between items-baseline mb-[14px]"><b className="text-[14px]">인터뷰 내용 칸 요약</b><span className="text-[12px] text-[rgba(33,30,25,.5)]">같은 글끼리 묶음</span></div>
            {data.memos.length === 0 ? (
              <div className="text-[13px] text-[rgba(33,30,25,.5)]">인터뷰 내용 칸에 적힌 메모가 없습니다.</div>
            ) : (
              <ul className="m-0 p-0 list-none max-h-[360px] overflow-y-auto grid gap-[10px]">
                {data.memos.map((g) => (
                  <li key={g.label} className="text-[13px] border-b border-[rgba(33,30,25,.06)] pb-[8px]">
                    <div className="flex justify-between gap-[10px]"><span className="font-medium">{g.label}</span><span className="whitespace-nowrap text-[rgba(33,30,25,.55)]">{g.count}건</span></div>
                    <div className="text-[12px] text-[rgba(33,30,25,.5)] mt-[3px]">{g.names.join(" · ")}{g.count > g.names.length ? ` 외 ${g.count - g.names.length}명` : ""}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {data && (
        <div className={CARD}>
          <div className="flex items-center gap-[10px] flex-wrap p-[16px] border-b border-[rgba(33,30,25,.1)]">
            <b className="text-[14px] mr-[6px]">전체 콜 목록</b>
            <select value={channel} onChange={(e) => setChannel(e.target.value as "all" | Channel)} className={`${FIELD} !w-auto`}>
              {CHANNEL_FILTER.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
            </select>
            {data.tabs.length > 1 && (
              <select value={tab} onChange={(e) => setTab(e.target.value)} className={`${FIELD} !w-auto`}>
                <option value="all">모든 탭</option>
                {data.tabs.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <select value={status} onChange={(e) => setStatus(e.target.value as "all" | CallStatus)} className={`${FIELD} !w-auto`}>
              {STATUS_FILTER.map((k) => <option key={k} value={k}>{k === "all" ? "모든 상태" : STATUS_KO[k]}</option>)}
            </select>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 · 전화 · 메모 검색" className={`${FIELD} !w-[220px]`} />
            <span className="text-[12.5px] text-[rgba(33,30,25,.5)] ml-auto">{rows.length}건 / {leads.length}건</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr><th className={TH}>신청</th><th className={TH}>채널</th><th className={TH}>이름</th><th className={TH}>연락처</th><th className={TH}>유입</th><th className={TH}>1차</th><th className={TH}>2차</th><th className={TH}>3차</th><th className={TH}>상태</th><th className={TH}>인터뷰 내용</th><th className={TH}>노트</th></tr></thead>
              <tbody>
                {rows.map((l) => <LeadRow key={l.key} l={l} />)}
                {rows.length === 0 && <EmptyRow colSpan={11}>조건에 맞는 신청이 없습니다.</EmptyRow>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function LeadRow({ l }: { l: CallLead }) {
  const src = [l.platform, l.campaign || l.form].filter(Boolean).join(" · ");
  return (
    <tr className="hover:bg-[rgba(33,30,25,.03)]">
      <td className={`${TD} text-[rgba(33,30,25,.6)]`} title={[l.createdAt ? `처음 ${fmtFull(l.createdAt)}` : "", l.lastAt && l.lastAt !== l.createdAt ? `최근 ${fmtFull(l.lastAt)}` : ""].filter(Boolean).join(" · ")}>{shortWhen(l.lastAt ?? l.createdAt)}</td>
      <td className={`${TD} text-[12.5px]`} title={l.tabs.join(", ")}>
        {channelKo(l.channel)}
        {l.subs.length > 1 && <span className="ml-[6px] text-[11px] px-[6px] py-[1px]" style={{ background: "rgba(122,84,32,.1)", color: "#7a5420" }}>재신청 {l.subs.length}회</span>}
        {l.channels.length > 1 && <span className="ml-[6px] text-[11px] px-[6px] py-[1px]" style={{ background: "rgba(90,61,36,.1)", color: "#5a3d24" }}>채널 중복</span>}
      </td>
      <td className={`${TD} font-medium`}>{l.name || "—"}</td>
      <td className={TD}>{l.phone}</td>
      <td className={`${TD} max-w-[220px] overflow-hidden text-ellipsis text-[12.5px] text-[rgba(33,30,25,.6)]`} title={src}>{src || "—"}</td>
      {l.calls.map((c, i) => <td key={i} className={`${TD} text-[12.5px]`}>{c || <span className="text-[rgba(33,30,25,.3)]">·</span>}</td>)}
      <td className={TD}><Badge style={statusBadge(l.status)}>{STATUS_KO[l.status]}{l.attempts ? ` ${l.attempts}차` : ""}</Badge></td>
      <td className={`${TD} whitespace-normal min-w-[160px] text-[12.5px]`}>{l.memo || <span className="text-[rgba(33,30,25,.3)]">—</span>}</td>
      <td className={`${TD} whitespace-normal min-w-[240px] max-w-[420px] text-[12px] leading-[1.5] text-[rgba(33,30,25,.75)]`} title={l.note}>{l.note ? l.note.split(/\r?\n/).filter(Boolean).slice(0, 4).map((x, i) => <div key={i}>{x}</div>) : <span className="text-[rgba(33,30,25,.3)]">—</span>}{l.note.split(/\r?\n/).filter(Boolean).length > 4 && <div className="text-[rgba(33,30,25,.45)]">… 위 「고객별 인터뷰」에서 전체 보기</div>}</td>
    </tr>
  );
}
