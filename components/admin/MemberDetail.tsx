"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CARD, BTN_PRIMARY, FIELD, Badge } from "./ui";
import { fmtDate, memberBadge, orderBadge, won } from "@/lib/admin/format";
import { MEMBER_STATUS_KO, PROVIDER_KO, type MemberRow, type OrderRow } from "@/lib/admin/types";
import { BOOKING_STATUS_KO } from "@/lib/bookings/types";
import { fmtDay, fmtTime } from "@/lib/programs/format";

/** 회원 상세 드로어: 기본 정보 · 예약/결제 이력 · 메모 · 상태 (ToDo M7) */
export function MemberDetail({ member, orders }: { member: MemberRow; orders: OrderRow[] }) {
  const router = useRouter();
  const [memo, setMemo] = useState(member.memo ?? "");
  const [status, setStatus] = useState(member.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memo, status }) });
      const j = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!j?.ok) throw new Error(j?.message ?? "저장하지 못했습니다.");
      setMsg("저장했습니다.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${CARD} p-[26px]`}>
      <div className="flex items-center gap-[12px] mb-[18px]">
        <div className="w-[40px] h-[40px] rounded-full bg-[#e7e0d3] flex items-center justify-center text-[14px] font-semibold flex-none">{member.name?.[0] ?? "?"}</div>
        <div className="min-w-0">
          <b className="text-[16px] block">{member.name || "이름 없음"}{member.role !== "member" && <span className="ml-[6px] text-[11px] text-brown tracking-[.1em]">{member.role === "owner" ? "OWNER" : "ADMIN"}</span>}</b>
          <span className="text-[12px] text-[rgba(33,30,25,.55)] break-all">{member.email}</span>
        </div>
        <Badge style={memberBadge(member.status)}>{MEMBER_STATUS_KO[member.status]}</Badge>
      </div>
      <div className="grid gap-[10px] mb-[20px]">
        <Row k="연락처" v={member.phone ?? "—"} />
        <Row k="가입" v={`${fmtDate(member.created_at)} · ${PROVIDER_KO[member.provider] ?? member.provider}`} />
        <Row k="초대코드" v={member.invite_code ?? "—"} />
        <Row k="참여 · 누적 결제" v={`${member.visits}회 · ${won(member.spent)}`} />
      </div>

      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">예약 · 결제 이력</div>
      {orders.length === 0 ? (
        <div className="text-[13px] text-[rgba(33,30,25,.5)] mb-[20px]">예약 이력이 없습니다.</div>
      ) : (
        <div className="grid gap-[8px] mb-[20px]">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/orders?id=${o.id}`} className="flex items-center justify-between gap-[10px] border border-[rgba(33,30,25,.1)] px-[12px] py-[10px] hover:border-brown">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{o.program?.name ?? "—"}</div>
                <div className="text-[11.5px] text-[rgba(33,30,25,.55)]">{o.session ? `${fmtDay(o.session.starts_at)} ${fmtTime(o.session.starts_at)}` : ""} · {won(o.amount)}{o.payment?.method ? ` · ${o.payment.method}` : ""}</div>
              </div>
              <Badge style={orderBadge(o.status)}>{BOOKING_STATUS_KO[o.status]}</Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[10px]">메모 · 상태</div>
      <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} placeholder="상담 내용, 특이사항 등 (회원에게 보이지 않음)" className={`${FIELD} resize-y mb-[8px]`} />
      <div className="flex gap-[8px] items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value as MemberRow["status"])} className={`${FIELD} flex-1`}>
          {Object.entries(MEMBER_STATUS_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button type="button" onClick={save} disabled={busy} className={`${BTN_PRIMARY} py-[10px]`}>{busy ? "저장 중…" : "저장"}</button>
      </div>
      <div className="mt-[8px] text-[11.5px] text-[rgba(33,30,25,.45)]">휴면·탈퇴 회원은 로그인해도 프로그램 예약이 막힙니다. 탈퇴는 로그인 시 첫 화면으로 돌려보냅니다.</div>
      {msg && <div className="mt-[10px] text-[12.5px] text-brown">{msg}</div>}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-[12px] text-[13.5px]"><span className="text-[rgba(33,30,25,.55)] flex-none">{k}</span><span className="text-right font-semibold break-all">{v}</span></div>;
}
