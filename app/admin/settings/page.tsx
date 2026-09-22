import type { Metadata } from "next";
import { headers } from "next/headers";
import { PurgeCacheButton } from "@/components/admin/PurgeCacheButton";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { CARD, PageTitle } from "@/components/admin/ui";
import { mergeDoc } from "@/lib/cms/get";
import { SETTINGS_DOCS } from "@/lib/settings/schema";
import { clientIp } from "@/lib/settings/ip";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "일반 설정 · RSC ADMIN" };

const FIREWALL_GUIDE = [
  ["국가 차단 (Vercel)", "Vercel 대시보드 → 프로젝트 rsc-platform → Firewall → Configure → + New Rule → Condition 을 Country 로, 값에 국가를 고르고 Action = Deny → Save → 우상단 Publish. (이 화면의 '접근 차단 → 차단 국가' 로도 되지만 Vercel 방화벽이 더 앞단에서 막아 비용이 들지 않습니다.)"],
  ["요청 제한 (Rate Limit)", "같은 화면에서 + New Rule → Condition 에 경로(예: Request Path starts with /api) → Action = Rate Limit → 초당/분당 허용 횟수 입력 → Save → Publish. 봇의 결제·로그인 반복 시도를 막는 용도입니다."],
  ["공격 대응 (Attack Challenge)", "Firewall 탭 상단 'Attack Challenge Mode' 를 켜면 트래픽 폭주 때 방문자에게 자동 확인 절차를 요구합니다. 평소에는 꺼 두고, 공격이 의심될 때만 켭니다."],
  ["IP 차단 (Vercel)", "+ New Rule → Condition 을 IP Address 로 → Action = Deny. 이 화면의 '접근 차단 → 차단 IP' 와 같은 효과이며 둘 중 편한 쪽을 쓰면 됩니다."],
];

/** 일반 설정 (M10): 사이트 상태 · 보안 · 접근 차단 · 캐시 · 알림 · 결제/환불. 값은 site_content(settings.*) */
export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [{ data: rows }, h] = await Promise.all([supabase.from("site_content").select("id, data, updated_at").eq("page", "settings"), headers()]);
  const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
  const myIp = clientIp(h) || "(알 수 없음)";
  const tossKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
  const status = [
    ["보안서버(HTTPS)", "적용됨 · Vercel 자동 인증서 (http → https 자동 전환)"],
    ["결제 모드", tossKey.startsWith("live_") ? "라이브 (실결제)" : tossKey ? "테스트 (실제 청구 없음)" : "키 없음"],
    ["이메일 발송", process.env.RESEND_API_KEY ? "RESEND_API_KEY 등록됨" : "RESEND_API_KEY 없음 (발송 안 됨)"],
    ["현재 내 IP", myIp],
    ["서버 리전", process.env.VERCEL_REGION ?? "(로컬)"],
  ];

  return (
    <>
      <PageTitle overline="SETTINGS" title="일반 설정" />
      <div className={`${CARD} p-[22px] mb-[20px]`}>
        <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[12px]">현재 상태</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[24px] gap-y-[8px] text-[13.5px]">
          {status.map(([k, v]) => <div key={k} className="flex justify-between gap-[12px] border-b border-[rgba(33,30,25,.08)] pb-[6px]"><span className="text-[rgba(33,30,25,.55)]">{k}</span><b className="text-right">{v}</b></div>)}
        </div>
        <div className="mt-[14px]"><PurgeCacheButton /></div>
      </div>

      <div className="grid gap-[20px]">
        {SETTINGS_DOCS.map((def) => {
          const row = byId.get(def.id);
          return (
            <div key={def.id} id={def.id} className="border-t border-[rgba(33,30,25,.12)] pt-[20px]">
              <SiteEditor key={`${def.id}-${row?.updated_at ?? "default"}`} def={def} initial={mergeDoc(def, (row?.data ?? null) as Record<string, unknown> | null)} previewHref="/" updatedAt={(row?.updated_at as string | undefined) ?? null} />
            </div>
          );
        })}
      </div>

      <div className={`${CARD} p-[22px] mt-[28px]`}>
        <div className="text-[12px] tracking-[.2em] text-[rgba(33,30,25,.5)] mb-[6px]">VERCEL 방화벽 (어드민에서 대체할 수 없는 항목)</div>
        <div className="text-[12.5px] text-[rgba(33,30,25,.55)] mb-[14px]">아래는 Vercel 대시보드에서 직접 설정합니다: <a href="https://vercel.com/theraumai-5200/rsc-platform/firewall" target="_blank" rel="noreferrer" className="text-brown font-semibold underline">vercel.com → rsc-platform → Firewall ↗</a></div>
        <div className="grid gap-[12px]">
          {FIREWALL_GUIDE.map(([k, v]) => <div key={k} className="grid md:grid-cols-[180px_1fr] gap-[6px] md:gap-[16px] text-[13.5px] leading-[1.7]"><b>{k}</b><span className="text-[rgba(33,30,25,.75)]">{v}</span></div>)}
        </div>
      </div>
    </>
  );
}
