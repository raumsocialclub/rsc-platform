import { vi } from "vitest";

// 테스트에서는 외부 서비스에 절대 나가지 않는다. 필요한 환경변수는 가짜 값으로.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "anon-test";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "service-test";
process.env.TOSS_SECRET_KEY ??= "test_gsk_dummy";
process.env.NEXT_PUBLIC_SITE_URL ??= "https://test.example";

// 운영 알림·이메일은 호출 여부만 확인한다
vi.mock("@/lib/alert", () => ({ opsAlert: vi.fn(async () => undefined) }));
vi.mock("@/lib/notify", () => ({
  sendBookingConfirmed: vi.fn(async () => ({ sent: false, reason: "TEST" })),
  sendInviteCode: vi.fn(async () => ({ sent: false, reason: "TEST" })),
  sendAdminInvite: vi.fn(async () => ({ sent: false, reason: "TEST" })),
  sendOpsAlert: vi.fn(async () => ({ sent: false, reason: "TEST" })),
}));
// 일반 설정은 기본값
vi.mock("@/lib/settings/get", () => ({
  getSettings: vi.fn(async () => ({ refundDays: 3, refundRate: 100, lateRefundRate: 0, emailEnabled: true, fromName: "RSC", fromEmail: "t@t", alertEmail: "", adminAllowedIps: "", loginMaxFails: 5, loginLockMinutes: 15 })),
}));
