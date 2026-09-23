/**
 * 알림 발송 인터페이스. 1차는 이메일(Resend), 2차는 알림톡(솔라피).
 * RESEND_API_KEY 가 없으면 보내지 않고 { sent: false, reason: "NOT_CONFIGURED" } 를 돌려준다.
 * (M4: 어드민 화면에 코드 표시 + 복사만. 키가 등록되면 자동으로 발송이 붙는다.)
 */
export type NotifyResult = { sent: boolean; reason?: string; id?: string };

import { getSettings } from "@/lib/settings/get";

async function sendEmail(to: string, subject: string, html: string): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "NOT_CONFIGURED" };
  const st = await getSettings().catch(() => null);
  if (st && !st.emailEnabled) return { sent: false, reason: "DISABLED" };
  const FROM = process.env.NOTIFY_FROM_EMAIL ?? (st ? `${st.fromName} <${st.fromEmail}>` : "RAUM SOCIAL CLUB <onboarding@resend.dev>");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { sent: false, reason: j.message ?? `HTTP ${res.status}` };
    return { sent: true, id: j.id };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

/** 초대코드 안내 (FLOWS.md 1-2). 수신자 이메일이 없으면 보내지 않는다. */
export async function sendInviteCode(params: { to?: string | null; name?: string | null; code: string; expiresAt?: string | null }): Promise<NotifyResult> {
  if (!params.to) return { sent: false, reason: "NO_EMAIL" };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rsc-platform.vercel.app";
  const link = `${site}/join?code=${encodeURIComponent(params.code)}`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#211e19;line-height:1.7">
      <p>${params.name ?? "회원"}님, RAUM SOCIAL CLUB 초대코드를 안내드립니다.</p>
      <p style="font-size:22px;letter-spacing:.18em;font-weight:600">${params.code}</p>
      <p><a href="${link}">${link}</a> 에서 코드를 입력해 가입해 주세요.</p>
      ${params.expiresAt ? `<p style="color:#5a3d24">유효기간: ${params.expiresAt} 까지</p>` : ""}
    </div>`;
  return sendEmail(params.to, "[RSC] 초대코드 안내", html);
}

/** 예약 확정 (M6에서 사용) */
export async function sendBookingConfirmed(params: { to?: string | null; name?: string | null; programName: string; when: string; place?: string | null; amount: number }): Promise<NotifyResult> {
  if (!params.to) return { sent: false, reason: "NO_EMAIL" };
  const html = `
    <div style="font-family:Arial,sans-serif;color:#211e19;line-height:1.7">
      <p>${params.name ?? "회원"}님, 예약이 확정되었습니다.</p>
      <p><b>${params.programName}</b><br>${params.when}${params.place ? ` · ${params.place}` : ""}<br>결제금액 ${params.amount.toLocaleString("ko-KR")}원</p>
    </div>`;
  return sendEmail(params.to, "[RSC] 예약이 확정되었습니다", html);
}

/** 부관리자 초대 링크 (M12). 48시간 · 1회용 */
export async function sendAdminInvite(params: { to: string; name?: string | null; link: string; invitedBy?: string | null; expiresAt: string }): Promise<NotifyResult> {
  const html = `
    <div style="font-family:Arial,sans-serif;color:#211e19;line-height:1.7">
      <p>${params.name || "안녕하세요"}님, RAUM SOCIAL CLUB 관리자(부관리자)로 초대되었습니다.${params.invitedBy ? ` (초대: ${params.invitedBy})` : ""}</p>
      <p>아래 링크에서 비밀번호를 정하면 바로 관리자 화면에 들어갈 수 있습니다.</p>
      <p><a href="${params.link}" style="display:inline-block;padding:12px 20px;background:#5a3d24;color:#f7f3ec;text-decoration:none;font-weight:600">관리자 계정 만들기</a></p>
      <p style="font-size:12px;color:#5a3d24">${params.link}<br>유효기간: ${params.expiresAt} 까지 · 한 번만 사용할 수 있습니다.</p>
    </div>`;
  return sendEmail(params.to, "[RSC] 관리자 초대", html);
}
