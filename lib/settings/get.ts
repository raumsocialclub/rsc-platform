import { getDoc } from "@/lib/cms/get";
import { SETTINGS_DOCS } from "./schema";

export type Settings = {
  maintenance: boolean; maintenanceMessage: string; maintenanceAllowIps: string;
  securityHeaders: boolean; adminAllowedIps: string; loginMaxFails: number; loginLockMinutes: number;
  blockedIps: string; blockedCountries: string; blockMessage: string;
  cacheSeconds: number;
  emailEnabled: boolean; fromName: string; fromEmail: string;
  refundDays: number; refundRate: number; lateRefundRate: number;
};

/** 모든 settings.* 문서를 한 객체로 (기본값 + DB 값). 서버 컴포넌트·Route Handler 용 */
export async function getSettings(): Promise<Settings> {
  const out: Record<string, unknown> = {};
  for (const d of SETTINGS_DOCS) Object.assign(out, d.defaults);
  const docs = await Promise.all(SETTINGS_DOCS.map((d) => getDoc(d.id)));
  for (const d of docs) Object.assign(out, d);
  return out as Settings;
}
