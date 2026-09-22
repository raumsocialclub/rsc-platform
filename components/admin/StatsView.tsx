import Link from "next/link";
import { CARD, TH, TD, EmptyRow, PageTitle } from "./ui";
import { won } from "@/lib/admin/format";
import type { Stats } from "@/lib/admin/statsFull";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtFull } from "@/lib/programs/format";
import { MEMBER_STATUS_KO, PROVIDER_KO } from "@/lib/admin/types";

const PRESETS = [{ k: "7d", l: "7일" }, { k: "30d", l: "30일" }, { k: "90d", l: "90일" }, { k: "month", l: "이번 달" }, { k: "last", l: "지난 달" }, { k: "year", l: "올해" }];
const INQ: Record<string, string> = { pending: "대기", contacted: "상담 진행", invited: "초대 완료", closed: "보류" };
const ACTION: Record<string, string> = { "site.save": "사이트 저장", "site.reset": "사이트 기본값", "order.refund": "환불/취소", "member.update": "회원 수정", "program.create": "프로그램 등록", "program.update": "프로그램 수정", "program.publish": "프로그램 공개 변경", "program.delete": "프로그램 삭제", "invite.issue": "초대코드 발급" };

function Csv({ type, range }: { type: string; range: Stats["range"] }) {
  return <a href={`/api/admin/stats/export?type=${type}&from=${range.from}&to=${range.to}`} className="text-[12px] text-brown font-semibold whitespace-nowrap">CSV ↓</a>;
}
function Card({ title, csv, range, children, className = "" }: { title: string; csv?: string; range: Stats["range"]; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${CARD} p-[22px] min-w-0 ${className}`}>
      <div className="flex justify-between items-center mb-[14px] gap-[10px]"><b className="text-[14px]">{title}</b>{csv && <Csv type={csv} range={range} />}</div>
      {children}
    </div>
  );
}
function Bars({ data, color = "#c9b79a", fmt }: { data: { label: string; value: number }[]; color?: string; fmt: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <>
      <div className="flex items-end gap-[3px] h-[120px]">
        {data.map((d, i) => <div key={i} title={`${d.label} · ${fmt(d.value)}`} className="flex-1 min-w-0" style={{ height: `${Math.max(2, Math.round((d.value / max) * 100))}%`, background: d.value ? (i === data.length - 1 ? "#5a3d24" : color) : "rgba(33,30,25,.06)" }} />)}
      </div>
      <div className="flex justify-between text-[11px] text-[rgba(33,30,25,.45)] mt-[6px]"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </>
  );
}
function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse w-full">
        <thead><tr>{head.map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={head.length}>{empty}</EmptyRow>}
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`${TD} ${j > 0 ? "text-right" : ""}`}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
const shortDay = (d: string) => d.slice(5).replace("-", ".");

/** 통계 · 리포트 (M9): 매출 · 예약 · 회원 · 접속 · 전환 · 관리자 활동, 항목별 CSV */
export function StatsView({ s, preset }: { s: Stats; preset: string }) {
  const r = s.range;
  const tr = s.traffic;
  const kpi = [
    { l: "순매출", v: won(s.revenue.totals.net), d: `결제 ${won(s.revenue.totals.paid)} · 환불 ${won(s.revenue.totals.refunded)}` },
    { l: "결제 건수", v: `${s.revenue.totals.count}건`, d: `예약 생성 ${s.bookings.total}건` },
    { l: "신규 회원", v: `${s.members.totals.inRange}명`, d: `전체 ${s.members.totals.total}명 · 활동 ${s.members.totals.active}명` },
    { l: "방문자", v: `${tr?.totals?.uv ?? 0}명`, d: `페이지뷰 ${tr?.totals?.pv ?? 0}` },
  ];
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  return (
    <>
      <PageTitle overline="ANALYTICS" title="통계 · 리포트" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">{r.from} ~ {r.to}</span>}>
        <form method="get" action="/admin/stats" className="flex gap-[8px] flex-wrap items-center">
          {PRESETS.map((p) => (
            <Link key={p.k} href={`/admin/stats?preset=${p.k}`} className="border border-[rgba(33,30,25,.2)] px-[12px] py-[8px] text-[12.5px]" style={{ background: preset === p.k ? "#fff" : "transparent", fontWeight: preset === p.k ? 600 : 400 }}>{p.l}</Link>
          ))}
          <input type="date" name="from" defaultValue={r.from} className="px-[10px] py-[7px] text-[12.5px] border border-[rgba(33,30,25,.2)] bg-white" />
          <span className="text-[12px]">~</span>
          <input type="date" name="to" defaultValue={r.to} className="px-[10px] py-[7px] text-[12.5px] border border-[rgba(33,30,25,.2)] bg-white" />
          <button type="submit" className="border border-brown bg-transparent text-brown px-[12px] py-[8px] text-[12.5px] font-semibold cursor-pointer">적용</button>
          <a href={`/api/admin/stats/export?type=all&from=${r.from}&to=${r.to}`} className="border-0 bg-brown text-cream hover:text-cream px-[16px] py-[9px] text-[12.5px] font-semibold">전체 리포트 CSV ↓</a>
        </form>
      </PageTitle>

      <div className="grid grid-cols-2 min-[1201px]:grid-cols-4 gap-[16px] mb-[20px]">
        {kpi.map((k) => (
          <div key={k.l} className={`${CARD} px-[22px] py-[20px]`}>
            <div className="text-[11.5px] tracking-[.08em] text-[rgba(33,30,25,.5)] mb-[10px]">{k.l}</div>
            <div className="text-[clamp(18px,1.6vw,24px)] font-semibold whitespace-nowrap">{k.v}</div>
            <div className="text-[12px] text-[rgba(33,30,25,.55)] mt-[6px]">{k.d}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[16px] mb-[16px]">
        <Card title="일별 순매출" csv="revenue-daily" range={r}><Bars data={s.revenue.daily.map((d) => ({ label: shortDay(d.day), value: d.net }))} fmt={won} /></Card>
        <Card title="프로그램별 매출" csv="revenue-program" range={r}>
          <Table head={["프로그램", "순매출", "건수"]} rows={s.revenue.byProgram.map((p) => [p.name, won(p.net), p.count])} empty="기간 내 결제가 없습니다." />
        </Card>
      </div>
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-3 gap-[16px] mb-[16px]">
        <Card title="결제수단별" csv="revenue-method" range={r}><Table head={["결제수단", "순매출", "건수"]} rows={s.revenue.byMethod.map((m) => [m.method, won(m.net), m.count])} empty="없음" /></Card>
        <Card title="예약 상태별 (기간 내 생성)" csv="orders" range={r}><Table head={["상태", "건수"]} rows={s.bookings.byStatus.map((b) => [BOOKING_STATUS_KO[b.status as keyof typeof BOOKING_STATUS_KO] ?? b.status, b.count])} empty="없음" /></Card>
        <Card title="상담 신청" csv="inquiries" range={r}><Table head={["상태", "건수"]} rows={s.inquiries.byStatus.map((b) => [INQ[b.status] ?? b.status, b.count])} empty="기간 내 신청이 없습니다." /></Card>
      </div>

      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[16px] mb-[16px]">
        <Card title="일별 신규 회원" csv="members" range={r}><Bars data={s.members.daily.map((d) => ({ label: shortDay(d.day), value: d.count }))} color="#9c6b3e" fmt={(v) => `${v}명`} /></Card>
        <Card title="회원 현황" csv="members" range={r}>
          <Table head={["구분", "수"]} rows={[["전체", s.members.totals.total], ...(["active", "paused", "withdrawn"] as const).map((k) => [MEMBER_STATUS_KO[k], s.members.totals[k]]), ...s.members.byProvider.map((p) => [`기간 내 가입 · ${PROVIDER_KO[p.provider] ?? p.provider}`, p.count])]} empty="없음" />
        </Card>
      </div>

      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px] mt-[8px]">접속 통계</div>
      {!tr ? <div className={`${CARD} p-[22px] text-[13px] text-[rgba(33,30,25,.5)] mb-[16px]`}>접속 통계를 불러오지 못했습니다.</div> : (
        <>
          <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-[16px] mb-[16px]">
            <Card title="일별 페이지뷰 · 방문자" csv="traffic-daily" range={r}>
              <Bars data={s.revenue.daily.map((d) => ({ label: shortDay(d.day), value: tr.daily.find((x) => x.day === d.day)?.pv ?? 0 }))} fmt={(v) => `${v} PV`} />
              <div className="text-[11.5px] text-[rgba(33,30,25,.5)] mt-[8px]">방문자는 브라우저 쿠키 기준(1년). 어드민·API 경로는 집계하지 않습니다.</div>
            </Card>
            <Card title="전환 퍼널" csv="funnel" range={r}>
              <Table head={["단계", "수", "전환"]} rows={[["방문자", s.funnel.visitors, "—"], ["상담 신청", s.funnel.inquiries, pct(s.funnel.inquiries, s.funnel.visitors)], ["가입", s.funnel.signups, pct(s.funnel.signups, s.funnel.inquiries)], ["결제 회원", s.funnel.payers, pct(s.funnel.payers, s.funnel.signups)]]} empty="" />
            </Card>
          </div>
          <div className="grid grid-cols-1 min-[1201px]:grid-cols-3 gap-[16px] mb-[16px]">
            <Card title="많이 본 페이지" csv="traffic-paths" range={r}><Table head={["경로", "PV", "UV"]} rows={tr.paths.map((p) => [p.path, p.pv, p.uv])} empty="아직 기록이 없습니다." /></Card>
            <Card title="유입 경로" csv="traffic-referrers" range={r}><Table head={["유입", "PV"]} rows={tr.referrers.map((p) => [p.host, p.pv])} empty="아직 기록이 없습니다." /></Card>
            <Card title="기기 · 국가" range={r}><Table head={["구분", "PV"]} rows={[...tr.devices.map((d) => [d.device === "mobile" ? "모바일" : d.device === "desktop" ? "데스크톱" : d.device, d.pv]), ...tr.countries.map((c) => [`국가 ${c.country}`, c.pv])]} empty="아직 기록이 없습니다." /></Card>
          </div>
        </>
      )}

      <Card title="관리자 활동 로그 (최근 50)" csv="logs" range={r}>
        <Table head={["일시", "관리자", "작업", "대상"]} rows={s.logs.map((l) => [fmtFull(l.ts), l.admin, ACTION[l.action] ?? l.action, <span key="t" className="text-[12px] text-[rgba(33,30,25,.6)]">{l.target ?? ""}{l.detail && "label" in l.detail ? ` · ${String(l.detail.label)}` : ""}{l.detail && "refunded" in l.detail ? ` · ${won(Number(l.detail.refunded))}` : ""}</span>])} empty="아직 활동 기록이 없습니다." />
      </Card>
    </>
  );
}
