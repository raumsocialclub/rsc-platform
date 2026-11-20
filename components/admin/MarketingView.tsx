"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BTN_SECONDARY, CARD, TH, TD, Badge, EmptyRow, PageTitle } from "./ui";
import { badgeStyle, fmtDate, fmtShortDate } from "@/lib/admin/format";
import { reconfirmDue, reconfirmSoon, trackKo, type MarketingConsentRow } from "@/lib/inquiries/marketing";

/**
 * 마케팅 정보 수신 동의 목록 (/admin/marketing). 상담 신청 때 「마케팅 정보 수신 동의(선택)」에 체크한 분만 들어온다.
 * 철회 요청(전화·문자 등)이 오면 「철회」를 누른다 → 발송 대상에서 빠지고 철회 일시가 남는다(잘못 눌렀으면 「철회 취소」). 재확인 예정일(동의일 + 2년)이 30일 안이면 표시.
 */
export function MarketingView({ rows, state, owner }: { rows: MarketingConsentRow[]; state: "" | "active" | "withdrawn"; owner: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const active = rows.filter((r) => !r.withdrawn_at).length;
  const tab = (s: string, label: string) => <Link href={`/admin/marketing${s ? `?state=${s}` : ""}`} className={`px-[10px] py-[5px] rounded-ds-sm border ${state === s ? "border-primary text-primary" : "border-lineNeutral text-labelAlt hover:border-line"}`}>{label}</Link>;
  const toggle = async (r: MarketingConsentRow) => {
    const withdrawn = !r.withdrawn_at;
    if (withdrawn && !confirm(`${r.name} 님의 마케팅 수신 동의를 철회 처리할까요? 발송 대상에서 빠집니다.`)) return;
    setBusy(r.id); setMsg(null);
    try {
      const res = await fetch(`/api/admin/marketing/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ withdrawn }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "저장하지 못했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <PageTitle overline="MARKETING" title="마케팅 수신 동의" aside={<span className="text-[16px] text-[rgba(55,56,60,.61)]">수신 동의 {active}건</span>}>
        <div className="flex flex-wrap items-center gap-[6px] text-[13px]">
          {tab("", "전체")}{tab("active", "동의 중")}{tab("withdrawn", "철회")}
          {owner && <a href={`/api/admin/marketing/export${state ? `?state=${state}` : ""}`} className={`${BTN_SECONDARY} ml-[6px]`}>CSV 다운로드</a>}
        </div>
      </PageTitle>
      <div className="mb-[14px] text-[13px] text-[rgba(55,56,60,.61)]">상담 신청(/fit-check)에서 「마케팅 정보 수신 동의(선택)」에 체크한 분만 표시됩니다. 상담 신청 기록은 180일 뒤 지워져도 수신 동의는 철회할 때까지 남습니다. 법령에 따라 2년마다 수신 동의 여부를 확인해야 하므로 「재확인 예정일」이 가까운 분께는 계속 받을지 확인해 주세요.</div>
      {msg && <p role="alert" className="mb-[10px] text-[13px] text-negativeFg">{msg}</p>}
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["동의일", "이름", "휴대폰", "거주지역", "관심 방식", "동의문", "재확인 예정", "상태", ""].map((h, i) => <th key={i} className={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={9}>{state ? "해당하는 동의가 없습니다." : "아직 마케팅 수신 동의가 없습니다."}</EmptyRow>}
              {rows.map((r) => {
                const soon = !r.withdrawn_at && reconfirmSoon(r.consent_at);
                return (
                  <tr key={r.id} className="hover:bg-[rgba(112,115,124,.05)]">
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`} title={fmtDate(r.consent_at, true)}>{fmtDate(r.consent_at)}</td>
                    <td className={`${TD} font-bold`}>{r.name}</td>
                    <td className={TD}>{r.phone}</td>
                    <td className={TD}>{r.region || "—"}</td>
                    <td className={TD}>{trackKo(r.track) || "—"}</td>
                    <td className={`${TD} text-[rgba(55,56,60,.61)]`}>{r.consent_version}</td>
                    <td className={`${TD} ${soon ? "text-negativeFg font-semibold" : "text-[rgba(55,56,60,.61)]"}`}>{fmtDate(reconfirmDue(r.consent_at))}{soon && " · 확인 필요"}</td>
                    <td className={TD}>{r.withdrawn_at ? <Badge style={badgeStyle("mute")}>철회 {fmtShortDate(r.withdrawn_at)}</Badge> : <Badge style={badgeStyle("ok")}>동의</Badge>}</td>
                    <td className={TD}><button type="button" disabled={busy === r.id} onClick={() => toggle(r)} className="text-[13px] underline text-labelAlt hover:text-label disabled:opacity-50">{r.withdrawn_at ? "철회 취소" : "철회"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
