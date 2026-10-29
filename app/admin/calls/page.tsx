import type { Metadata } from "next";
import { CallsDashboard } from "@/components/admin/CallsDashboard";
import { CARD, PageTitle } from "@/components/admin/ui";
import { loadCallsDataSafe } from "@/lib/crm/load";
import { crmConfigured } from "@/lib/crm/sheet";

export const metadata: Metadata = { title: "콜 현황" };
/** 시트(Apps Script) 응답을 최대 25초 기다리므로 서버 함수 한도를 넉넉히 */
export const maxDuration = 30;

/**
 * /admin/calls — 구글 시트(CRM)의 콜 결과·인터뷰 메모를 한 화면에 (M18).
 * 첫 화면은 서버에서 읽어 바로 보여주고, 이후는 클라이언트가 30초마다 /api/admin/crm-calls 로 갱신한다.
 * 시트 연결(CRM_SHEET_URL · CRM_SHEET_TOKEN)이 없으면 설정 안내를 보여준다.
 */
export default async function AdminCallsPage() {
  if (!crmConfigured()) return <SetupGuide />;
  const { data, error } = await loadCallsDataSafe();
  return <CallsDashboard initial={data} initialError={error} />;
}

function SetupGuide() {
  return (
    <>
      <PageTitle overline="CALL TRACKING" title="콜 현황" />
      <div className={`${CARD} p-[24px] max-w-[760px] text-[13.5px] leading-[1.8]`}>
        <b className="block text-[15px] mb-[10px]">구글 시트 연결이 아직 안 되어 있습니다</b>
        <p className="m-0 mb-[12px] text-[rgba(33,30,25,.7)]">콜 현황은 CRM 구글 시트를 읽어 보여줍니다. 한 번만 아래 순서로 연결하면 이후에는 시트에 적는 대로 이 화면이 따라갑니다. 자세한 안내는 SETUP.md 4-4.</p>
        <ol className="m-0 pl-[20px] grid gap-[6px]">
          <li>구글 시트 → 확장 프로그램 → Apps Script 에 <code>deploy/crm-sheet-webapp.gs</code> 내용을 붙여 넣고 저장</li>
          <li>프로젝트 설정 → 스크립트 속성에 <code>TOKEN</code> 추가. 값은 직접 정한 긴 비밀 문자열(영문·숫자 24자 이상). 같은 값을 Vercel 환경변수 <code>CRM_SHEET_TOKEN</code> 에도 넣기</li>
          <li>배포 → 새 배포 → 웹 앱 · 실행 사용자 「나」 · 액세스 「모든 사용자」 → 배포 주소 복사</li>
          <li>Vercel 환경변수 <code>CRM_SHEET_URL</code> 에 그 주소를 넣고 재배포</li>
        </ol>
      </div>
    </>
  );
}
