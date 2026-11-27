import Link from "next/link";
import { CARD, Badge } from "./ui";
import { JoinApproveButton } from "./JoinApproveButton";
import { badgeStyle, fmtDate } from "@/lib/admin/format";
import { JOIN_STATE_KO, type ProfileCard } from "@/lib/inquiries/join";

/**
 * 회원 프로필 카드 (2026-11-23): 왼쪽 사진(비공개 버킷 → 5분 서명 URL 로 이동하는 /api/admin/inquiries/:id/photo?n=), 오른쪽 기본 정보 → 섹션별 표.
 * 레퍼런스(결혼정보회사 CRM 회원 카드)의 「사진 + 기본 정보 표」 배치만 참고. 가입 승인/취소 버튼은 카드 머리에.
 */
export function JoinProfileCard({ id, card, approvedByName }: { id: string; card: ProfileCard; approvedByName?: string | null }) {
  const approved = card.state === "approved";
  return (
    <section className={`${CARD} p-[24px] md:p-[28px]`} data-testid="join-profile-card">
      <div className="flex items-start justify-between gap-[16px] flex-wrap mb-[20px]">
        <div>
          <Link href="/admin/join" className="inline-block text-[13px] text-[rgba(55,56,60,.61)] mb-[8px]">← 가입 신청 목록</Link>
          <div className="flex items-center gap-[10px] flex-wrap">
            <h2 className="text-[24px] font-semibold text-label m-0">{card.name}</h2>
            <Badge style={badgeStyle(approved ? "ok" : "warn")}>{JOIN_STATE_KO[card.state]}</Badge>
          </div>
          <div className="text-[14px] text-[rgba(55,56,60,.61)] mt-[4px]">{card.headline || "기본 정보 없음"}</div>
          {approved && <div className="text-[12px] text-[rgba(55,56,60,.61)] mt-[2px]">가입 승인 {fmtDate(card.approvedAt, true)}{approvedByName ? ` · ${approvedByName}` : ""}</div>}
        </div>
        <JoinApproveButton id={id} approved={approved} name={card.name} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-[24px] items-start">
        <div>
          {card.photos > 0 ? (
            <div className="grid gap-[10px]">
              {Array.from({ length: card.photos }).map((_, i) => (
                <a key={i} href={`/api/admin/inquiries/${id}/photo?n=${i}`} target="_blank" rel="noreferrer" className="block rounded-ds overflow-hidden border border-lineAlt bg-fill aspect-[3/4]" title="새 창에서 원본 보기 (5분 링크)">
                  {/* 관리자 세션 쿠키로 서명 URL 에 302 — next/image 는 외부 호스트 설정이 필요해 일반 img 를 쓴다 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/admin/inquiries/${id}/photo?n=${i}`} alt={`${card.name} 사진 ${i + 1}`} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-ds border border-dashed border-lineNeutral bg-fill aspect-[3/4] flex items-center justify-center text-[13px] text-[rgba(55,56,60,.61)] text-center px-[12px]">사진 없음<br />(나중에 받기로 함)</div>
          )}
          <div className="mt-[12px] grid gap-[6px] text-[13px]">
            <div className="flex justify-between gap-[8px]"><span className="text-[rgba(55,56,60,.61)]">휴대폰</span><b>{card.phone || "—"}</b></div>
            {card.email && <div className="flex justify-between gap-[8px]"><span className="text-[rgba(55,56,60,.61)]">이메일</span><b className="truncate">{card.email}</b></div>}
          </div>
        </div>
        <div className="grid gap-[18px]">
          {card.sections.map((s) => (
            <div key={s.title}>
              <div className="text-[11px] tracking-[.04em] font-semibold text-primary mb-[8px]">{s.title}</div>
              <dl className="grid grid-cols-1 min-[700px]:grid-cols-2 gap-x-[20px] gap-y-[6px] m-0">
                {s.rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-[12px] border-b border-[rgba(112,115,124,.08)] pb-[6px] text-[13px]">
                    <dt className="text-[rgba(55,56,60,.61)] flex-none">{r.label}</dt>
                    <dd className="m-0 font-semibold text-right text-label break-words min-w-0">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {card.sections.length === 0 && <div className="text-[13px] text-[rgba(55,56,60,.61)]">설문 답변 정보가 없습니다.</div>}
        </div>
      </div>
    </section>
  );
}
