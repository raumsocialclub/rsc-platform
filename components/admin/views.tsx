import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { InquiryDetail, type InquiryRow } from "./InquiryDetail";
import { IssueInviteForm } from "./IssueInviteForm";
import { InquiriesFilter } from "./InquiriesFilter";
import { CopyButton } from "./CopyButton";
import { INQUIRY_STATUS, badgeStyle, fmtDate, fmtShortDate, inquiryBadge } from "@/lib/admin/format";
import type { InquiryCrm } from "@/lib/crm/inquiries";
import { STATUS_KO, type CallStatus } from "@/lib/crm/types";
import { PROFILES } from "@/lib/fit-check/questions";

/* ---------- 상담 신청 ---------- */
/** 유입 광고 요약: utm_source / utm_campaign (UTM 이 없으면 "기록 없음" — 광고를 안 봤다는 뜻은 아님) */
export const utmLabel = (utm: InquiryRow["utm"]) => (utm?.utm_source ? [utm.utm_source, utm.utm_campaign].filter(Boolean).join(" / ") : "기록 없음");

/** 시트 콜 결과 배지 (콜 현황 화면과 같은 색) */
export const callBadge = (s: CallStatus) => badgeStyle(s === "done" ? "ok" : s === "callback" ? "warn" : s === "invalid" || s === "declined" ? "bad" : "mute");
export const callLabel = (c: Pick<InquiryCrm, "status" | "attempts">) => (c.attempts ? `${STATUS_KO[c.status]} · ${c.attempts}차` : STATUS_KO[c.status]);

export type CrmInfo = { at: string | null; error: string | null } | null;

export function InquiriesView({ rows, selected, filter, options, canExport = false, crm = {}, crmInfo = null }: { rows: InquiryRow[]; selected: InquiryRow | null; filter: { source: string; campaign: string }; options: { sources: string[]; campaigns: string[] }; canExport?: boolean; crm?: Record<string, InquiryCrm>; crmInfo?: CrmInfo }) {
  const pending = rows.filter((r) => r.status === "pending").length;
  const profile = selected?.result_type ? Object.values(PROFILES).find((p) => p.en === selected.result_type) : undefined;
  const filtered = !!(filter.source || filter.campaign);
  const matched = rows.filter((r) => crm[r.id]).length;
  return (
    <>
      <PageTitle overline="FIT CHECK" title="상담 신청" aside={<span className="text-[16px] text-[rgba(33,30,25,.5)]">대기 {pending}건</span>}>
        <InquiriesFilter filter={filter} options={options} canExport={canExport} />
      </PageTitle>
      {crmInfo && (
        <div className={`text-[12.5px] mb-[12px] ${crmInfo.error ? "text-[#a3402c]" : "text-[rgba(33,30,25,.55)]"}`}>
          {crmInfo.error
            ? `CRM 시트를 읽지 못해 콜 결과·상태 연동을 건너뛰었습니다 (${crmInfo.error})`
            : `CRM관리 시트 콜 결과 연동 중 · 시트 ${fmtDate(crmInfo.at, true)} 기준 · 이 목록에서 시트에 있는 신청 ${matched}건. 시트에 콜이 적히면 상태가 「상담 진행」(거절·없는 번호는 「보류」)으로 자동 변경되고, 직접 바꾼 상태는 그대로 둡니다.`}
        </div>
      )}
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-[20px] items-start">
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["신청일", "이름", "연락처", "성향 결과", "가능 시간", "유입 광고", "콜 결과", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={8}>{filtered ? "조건에 맞는 상담 신청이 없습니다." : "아직 상담 신청이 없습니다. /fit-check 에서 설문을 제출하면 여기에 표시됩니다."}</EmptyRow>}
                {rows.map((r) => {
                  const active = selected?.id === r.id;
                  return (
                    <tr key={r.id} className={active ? "bg-[rgba(226,180,120,.18)]" : "hover:bg-[#faf7f1]"}>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}><Link href={`/admin/inquiries?id=${r.id}`} className="block">{fmtShortDate(r.created_at)}</Link></td>
                      <td className={TD}><Link href={`/admin/inquiries?id=${r.id}`} className="block font-bold">{r.name || "—"}</Link></td>
                      <td className={TD}>{r.phone || "—"}</td>
                      <td className={TD}>{r.result_type || "—"}</td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{r.answers?.slot || "—"}</td>
                      <td className={`${TD} text-[rgba(33,30,25,.6)]`}>{utmLabel(r.utm)}</td>
                      <td className={TD}>{crm[r.id] ? <Badge style={callBadge(crm[r.id].status)}>{callLabel(crm[r.id])}</Badge> : <span className="text-[rgba(33,30,25,.35)]" title={crmInfo ? "CRM 시트에 같은 전화번호가 없습니다" : undefined}>—</span>}</td>
                      <td className={TD}><Badge style={inquiryBadge(r.status)}>{INQUIRY_STATUS[r.status] ?? r.status}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selected ? (
          <InquiryDetail key={selected.id} inquiry={selected} profileKo={profile?.ko} profileBody={profile?.body} crm={crm[selected.id] ?? null} />
        ) : (
          <div className={`${CARD} p-[26px] text-[13px] text-[rgba(33,30,25,.5)]`}>목록에서 신청을 선택하면 상세가 표시됩니다.</div>
        )}
      </div>
    </>
  );
}

/* ---------- 쿠폰 · 초대권 ---------- */
export type InviteRow = {
  id: string;
  code: string;
  issued_to_name: string | null;
  issued_to_phone: string | null;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_by_name?: string | null;
  inquiry_name?: string | null;
};

export function CouponsView({ invites }: { invites: InviteRow[] }) {
  const stateOf = (r: InviteRow) => {
    if (r.used_at) return { label: "사용됨", style: badgeStyle("brand") };
    if (r.expires_at && new Date(r.expires_at) < new Date()) return { label: "만료", style: badgeStyle("bad") };
    return { label: "미사용", style: badgeStyle("ok") };
  };
  return (
    <>
      <PageTitle overline="COUPONS & INVITES" title="쿠폰 · 초대권">
        <IssueInviteForm />
      </PageTitle>
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">초대코드</div>
      <div className={`${CARD} mb-[28px]`}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["코드", "발급 대상", "연락처", "상담 연결", "발급일", "만료", "사용", "상태", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {invites.length === 0 && <EmptyRow colSpan={9}>발급된 초대코드가 없습니다.</EmptyRow>}
              {invites.map((r) => {
                const st = stateOf(r);
                return (
                  <tr key={r.id} className="hover:bg-[#faf7f1]">
                    <td className={TD}><b className="tracking-[.06em]">{r.code}</b></td>
                    <td className={TD}>{r.issued_to_name || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{r.issued_to_phone || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{r.inquiry_name || "—"}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{fmtDate(r.created_at)}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{fmtDate(r.expires_at)}</td>
                    <td className={`${TD} text-[rgba(33,30,25,.65)]`}>{r.used_at ? `${fmtDate(r.used_at)}${r.used_by_name ? ` · ${r.used_by_name}` : ""}` : "—"}</td>
                    <td className={TD}><Badge style={st.style}>{st.label}</Badge></td>
                    <td className={TD}>{!r.used_at && <CopyButton text={r.code} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">지인 초대권 · 할인 쿠폰</div>
      <div className={`${CARD} p-[24px] text-[13px] text-[rgba(33,30,25,.5)]`}>지인 초대권(회원별 연 8/12매)과 할인 쿠폰은 멤버십 결제(2차)와 함께 붙습니다.</div>
    </>
  );
}
