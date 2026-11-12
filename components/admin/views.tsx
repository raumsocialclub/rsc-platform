import Link from "next/link";
import { CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { InquiryDetail, type InquiryRow } from "./InquiryDetail";
import { IssueInviteForm } from "./IssueInviteForm";
import { InquiriesFilter } from "./InquiriesFilter";
import { CopyButton } from "./CopyButton";
import { INQUIRY_STATUS, badgeStyle, fmtDate, fmtShortDate, inquiryBadge } from "@/lib/admin/format";
import { applySummary, isApply, type InquiryKind } from "@/lib/apply/export";
import type { InquiryCrm } from "@/lib/crm/inquiries";
import { STATUS_KO, type CallStatus } from "@/lib/crm/types";
import { PROFILES } from "@/lib/fit-check/questions";
import { entryLabel, inquiryTrack, trackLabel, type TrackFilter } from "@/lib/inquiries/track";
import { residenceLabel, type ProfileAnswers } from "@/lib/inquiries/profile";

/* ---------- 상담 신청 ---------- */
/** 유입 광고 요약: utm_source / utm_campaign (UTM 이 없으면 "기록 없음" — 광고를 안 봤다는 뜻은 아님) */
export const utmLabel = (utm: InquiryRow["utm"]) => (utm?.utm_source ? [utm.utm_source, utm.utm_campaign].filter(Boolean).join(" / ") : "기록 없음");

/** 시트 콜 결과 배지 (콜 현황 화면과 같은 색) */
export const callBadge = (s: CallStatus) => badgeStyle(s === "done" ? "ok" : s === "callback" ? "warn" : s === "invalid" || s === "declined" ? "bad" : "mute");
export const callLabel = (c: Pick<InquiryCrm, "status" | "attempts">) => (c.attempts ? `${STATUS_KO[c.status]} · ${c.attempts}차` : STATUS_KO[c.status]);

export type CrmInfo = { at: string | null; error: string | null } | null;

/** 목록 한 칸용 직업 · 학력 · 거주지 (2026-11-12 추가 항목, 없으면 빈 문자열) */
function profileSummary(r: { answers?: Record<string, unknown> | null }): string {
  const a = (r.answers ?? null) as ProfileAnswers | null;
  return [a?.job, a?.education, residenceLabel(a)].filter((v): v is string => !!v).join(" · ");
}

/** 관심 방식 배지 색: 소셜클럽 초록 · 1:1 매칭 파랑 · 상담 후 결정 회색 */
const trackBadge = (r: InquiryRow) => { const t = inquiryTrack(r); return badgeStyle(t === "social" ? "ok" : t === "matching" ? "brand" : "mute"); };

export function InquiriesView({ rows, selected, filter, options, canExport = false, crm = {}, crmInfo = null }: { rows: InquiryRow[]; selected: InquiryRow | null; filter: { source: string; campaign: string; kind: InquiryKind; track: TrackFilter }; options: { sources: string[]; campaigns: string[] }; canExport?: boolean; crm?: Record<string, InquiryCrm>; crmInfo?: CrmInfo }) {
  const pending = rows.filter((r) => r.status === "pending").length;
  const applies = rows.filter(isApply).length;
  const profile = selected?.result_type ? Object.values(PROFILES).find((p) => p.en === selected.result_type) : undefined;
  const filtered = !!(filter.source || filter.campaign || filter.kind || filter.track);
  const matched = rows.filter((r) => crm[r.id]).length;
  return (
    <>
      <PageTitle overline="FIT CHECK" title="상담 신청" aside={<span className="text-[16px] text-[rgba(55,56,60,.61)]">대기 {pending}건{applies > 0 && <> · 설문 {applies}건</>}</span>}>
        <InquiriesFilter filter={filter} options={options} canExport={canExport} />
      </PageTitle>
      {crmInfo && (
        <div className={`text-[13px] mb-[12px] ${crmInfo.error ? "text-[#e52222]" : "text-[rgba(55,56,60,.61)]"}`}>
          {crmInfo.error
            ? `CRM 시트를 읽지 못해 콜 결과·상태 연동을 건너뛰었습니다 (${crmInfo.error})`
            : `CRM관리 시트 콜 결과 연동 중 · 시트 ${fmtDate(crmInfo.at, true)} 기준 · 이 목록에서 시트에 있는 신청 ${matched}건. 시트에 콜이 적히면 상태가 「상담 진행」(거절·없는 번호는 「보류」)으로 자동 변경되고, 직접 바꾼 상태는 그대로 둡니다.`}
        </div>
      )}
      <div className="grid grid-cols-1 min-[1201px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-[20px] items-start">
        <div className={CARD}>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead><tr>{["신청일", "이름", "연락처", "관심 방식 · 들어온 경로", "직업 · 학력 · 거주지", "성향 결과", "가능 시간", "유입 광고", "콜 결과", "상태"].map((h) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0 && <EmptyRow colSpan={10}>{filtered ? "조건에 맞는 상담 신청이 없습니다." : "아직 상담 신청이 없습니다. 홈 상담 신청(/fit-check)이나 상담 전 설문(/apply)이 제출되면 여기에 표시됩니다."}</EmptyRow>}
                {rows.map((r) => {
                  const active = selected?.id === r.id;
                  return (
                    <tr key={r.id} className={active ? "bg-[rgba(0,102,255,.06)]" : "hover:bg-[rgba(112,115,124,.05)]"}>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}><Link href={`/admin/inquiries?id=${r.id}`} className="block">{fmtShortDate(r.created_at)}</Link></td>
                      <td className={TD}><Link href={`/admin/inquiries?id=${r.id}`} className="block font-bold">{r.name || "—"}{r.answers?.form === "apply" && <span className="ml-[6px] inline-block px-[6px] py-[1px] text-[11px] font-semibold align-middle" style={badgeStyle("brand")}>설문</span>}</Link></td>
                      <td className={TD}>{r.phone || "—"}</td>
                      <td className={TD}>
                        {inquiryTrack(r) ? <Badge style={trackBadge(r)}>{trackLabel(r)}</Badge> : <span className="text-[rgba(55,56,60,.28)]">—</span>}
                        {entryLabel(r) && <div className="text-[11px] text-[rgba(55,56,60,.61)] mt-[3px] whitespace-nowrap">{entryLabel(r)}</div>}
                      </td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{profileSummary(r) || "—"}</td>
                      <td className={TD}>{r.result_type || (isApply(r) ? <span className="text-[rgba(55,56,60,.61)]">{applySummary(r) || "설문"}</span> : "—")}</td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.answers?.slot || "—"}</td>
                      <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{utmLabel(r.utm)}</td>
                      <td className={TD}>{crm[r.id] ? <Badge style={callBadge(crm[r.id].status)}>{callLabel(crm[r.id])}</Badge> : <span className="text-[rgba(55,56,60,.28)]" title={crmInfo ? "CRM 시트에 같은 전화번호가 없습니다" : undefined}>—</span>}</td>
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
          <div className={`${CARD} p-[26px] text-[13px] text-[rgba(55,56,60,.61)]`}>목록에서 신청을 선택하면 상세가 표시됩니다.</div>
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
      <div className="text-[12px] tracking-[.02em] text-[rgba(55,56,60,.61)] mb-[10px]">초대코드</div>
      <div className={`${CARD} mb-[28px]`}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["코드", "발급 대상", "연락처", "상담 연결", "발급일", "만료", "사용", "상태", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {invites.length === 0 && <EmptyRow colSpan={10}>발급된 초대코드가 없습니다.</EmptyRow>}
              {invites.map((r) => {
                const st = stateOf(r);
                return (
                  <tr key={r.id} className="hover:bg-[rgba(112,115,124,.05)]">
                    <td className={TD}><b className="tracking-[.06em]">{r.code}</b></td>
                    <td className={TD}>{r.issued_to_name || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.issued_to_phone || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.inquiry_name || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{fmtDate(r.created_at)}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{fmtDate(r.expires_at)}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.used_at ? `${fmtDate(r.used_at)}${r.used_by_name ? ` · ${r.used_by_name}` : ""}` : "—"}</td>
                    <td className={TD}><Badge style={st.style}>{st.label}</Badge></td>
                    <td className={TD}>{!r.used_at && <CopyButton text={r.code} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-[12px] tracking-[.02em] text-[rgba(55,56,60,.61)] mb-[10px]">지인 초대권 · 할인 쿠폰</div>
      <div className={`${CARD} p-[24px] text-[13px] text-[rgba(55,56,60,.61)]`}>지인 초대권(회원별 연 8/12매)과 할인 쿠폰은 멤버십 결제(2차)와 함께 붙습니다.</div>
    </>
  );
}
