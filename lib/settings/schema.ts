import type { DocDef } from "@/lib/cms/schema";

/**
 * 일반 설정 (M10). site_content 에 'settings.*' 문서로 저장되고 /admin/settings 에서 편집한다.
 * 기본값은 여기. proxy.ts(요청 앞단)·notify·refund 가 읽는다.
 */
const t = (key: string, label: string, hint?: string): DocDef["fields"][number] => ({ key, label, type: "text", hint });
const ta = (key: string, label: string, hint?: string): DocDef["fields"][number] => ({ key, label, type: "textarea", hint });
const n = (key: string, label: string, hint?: string): DocDef["fields"][number] => ({ key, label, type: "number", hint });
const b = (key: string, label: string): DocDef["fields"][number] => ({ key, label, type: "boolean" });

export const SETTINGS_DOCS: DocDef[] = [
  {
    id: "settings.site",
    page: "settings",
    label: "사이트 상태",
    description: "점검 모드를 켜면 관리자 화면(/admin, /login)만 열리고 나머지는 안내 문구가 표시됩니다.",
    fields: [b("maintenance", "점검 모드 켜기"), ta("maintenanceMessage", "점검 안내 문구"), ta("maintenanceAllowIps", "점검 중에도 접속 허용 IP", "줄마다 하나. 1.2.3.4 / 1.2.3.* / 1.2.3.0/24")],
    defaults: { maintenance: false, maintenanceMessage: "잠시 사이트를 점검하고 있습니다.\n곧 다시 찾아뵙겠습니다.", maintenanceAllowIps: "" },
  },
  {
    id: "settings.security",
    page: "settings",
    label: "보안",
    description: "HTTPS(보안서버)는 Vercel 이 자동 적용합니다. 관리자 허용 IP 를 비워 두면 모든 IP 에서 관리자 로그인이 가능합니다.",
    fields: [
      b("securityHeaders", "보안 헤더 적용 (HSTS · 프레임 차단 · Referrer 제한 · MIME 스니핑 차단)"),
      ta("adminAllowedIps", "관리자 허용 IP", "비우면 제한 없음. 줄마다 하나. 본인 IP 는 이 화면 상단에 표시됩니다"),
      n("loginMaxFails", "로그인 연속 실패 잠금 횟수", "0 이면 잠금 안 함"),
      n("loginLockMinutes", "잠금 시간(분)"),
    ],
    defaults: { securityHeaders: true, adminAllowedIps: "", loginMaxFails: 5, loginLockMinutes: 15 },
  },
  {
    id: "settings.access",
    page: "settings",
    label: "접근 차단",
    description: "차단된 IP·국가는 사이트 전체(관리자 포함)에 접속할 수 없습니다. 국가 코드는 KR, CN 처럼 2글자.",
    fields: [ta("blockedIps", "차단 IP", "줄마다 하나. 1.2.3.4 / 1.2.3.* / 1.2.3.0/24"), t("blockedCountries", "차단 국가", "쉼표로 구분. 예: CN, RU"), ta("blockMessage", "차단 안내 문구")],
    defaults: { blockedIps: "", blockedCountries: "", blockMessage: "접속이 제한된 환경입니다.\n문의: support@theraum.co.kr" },
  },
  {
    id: "settings.cache",
    page: "settings",
    label: "페이지 캐시",
    description: "비로그인 방문자에게 보이는 공개 페이지(메인·가격·혜택·상담·약관)를 CDN 에 캐시합니다. 어드민에서 저장하면 서버 캐시는 즉시 갱신되고, CDN 캐시는 이 시간 안에 갱신됩니다.",
    fields: [n("cacheSeconds", "공개 페이지 캐시 시간(초)", "0 이면 캐시 안 함. 권장 60")],
    defaults: { cacheSeconds: 60 },
  },
  {
    id: "settings.notify",
    page: "settings",
    label: "알림",
    description: "이메일 발송은 RESEND_API_KEY 가 등록되어 있어야 실제로 나갑니다.",
    fields: [b("emailEnabled", "이메일 발송 켜기"), t("fromName", "발신 이름"), t("fromEmail", "발신 주소", "Resend 에서 인증한 도메인의 주소"), t("alertEmail", "운영 알림 받는 이메일", "결제 실패·환불 실패·서버 오류가 나면 이 주소로 메일이 갑니다 (RESEND_API_KEY 필요). Sentry 알림은 Sentry 계정 이메일로 따로 갑니다")],
    defaults: { emailEnabled: true, fromName: "RAUM SOCIAL CLUB", fromEmail: "onboarding@resend.dev", alertEmail: "nse101@kakao.com" },
  },
  {
    id: "settings.payment",
    page: "settings",
    label: "결제 · 환불",
    description: "환불 정책은 회원 화면(프로그램 상세·내 예약·결제)에 자동 표시되고 취소 시 그대로 적용됩니다.",
    fields: [n("refundDays", "전액 환불 마감 (프로그램 시작 며칠 전까지)"), n("refundRate", "마감 전 환불률(%)"), n("lateRefundRate", "마감 후 환불률(%)", "0 이면 환불 불가")],
    defaults: { refundDays: 3, refundRate: 100, lateRefundRate: 0 },
  },
];
