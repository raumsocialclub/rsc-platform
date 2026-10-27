import { requireEnv } from "@/lib/supabase/env";
import type { SheetTab } from "./parse";

/**
 * 구글 시트는 Apps Script 웹앱(deploy/crm-sheet-webapp.gs)으로 읽는다. SETUP.md 4-4.
 * CRM_SHEET_URL  = 웹앱 배포 주소 (…/exec)
 * CRM_SHEET_TOKEN = 스크립트 속성 TOKEN 과 같은 값 (서버 전용)
 */
export function crmConfigured(): boolean {
  return !!(process.env.CRM_SHEET_URL && process.env.CRM_SHEET_TOKEN);
}

/** Apps Script 응답 대기 한도. 수식 탭을 건너뛰는 v3 스크립트면 보통 2~5초 */
const FETCH_TIMEOUT_MS = 25_000;

type WebAppJson = { ok?: boolean; message?: string; url?: unknown; tabs?: unknown; version?: unknown; updatedAt?: unknown; source?: unknown };

/** 시트 읽기 결과. notesSupported 는 Apps Script 가 셀 노트를 보내는 새 버전인지 (구버전이면 notes 칸 자체가 없다) */
export type SheetFetch = { tabs: SheetTab[]; url: string | null; notesSupported: boolean; noteCount: number; scriptVersion: number; updatedAt: string | null; source: "cache" | "live" | "" };

export async function fetchSheetTabs(): Promise<SheetFetch> {
  const u = new URL(requireEnv("CRM_SHEET_URL"));
  u.searchParams.set("token", requireEnv("CRM_SHEET_TOKEN"));
  const res = await fetch(u, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch((e: unknown) => {
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) {
      throw new Error(`시트 응답이 ${FETCH_TIMEOUT_MS / 1000}초를 넘었습니다. Apps Script 를 최신 버전(v4, 1분마다 미리 읽어 캐시)으로 올려 주세요 — 시트 → 확장 프로그램 → Apps Script 에 deploy/crm-sheet-webapp.gs 를 붙여 넣고 저장 → 함수 「setup」 실행(권한 허용) → 배포 → 배포 관리 → 새 버전.`);
    }
    throw e;
  });
  if (!res.ok) throw new Error(`시트에서 ${res.status} 응답이 왔습니다. 웹앱 배포 주소(CRM_SHEET_URL)를 확인해 주세요.`);
  const json = (await res.json().catch(() => null)) as WebAppJson | null;
  if (!json) throw new Error("시트 응답을 읽지 못했습니다. Apps Script 배포가 「모든 사용자」 접근으로 되어 있는지 확인해 주세요.");
  if (!json.ok) throw new Error(json.message === "unauthorized" ? "시트 토큰이 맞지 않습니다. Apps Script 스크립트 속성 TOKEN 과 Vercel 의 CRM_SHEET_TOKEN 이 같은지 확인해 주세요." : "시트 응답 형식이 올바르지 않습니다.");
  let notesSupported = false;
  let noteCount = 0;
  const tabs: SheetTab[] = Array.isArray(json.tabs)
    ? (json.tabs as unknown[]).map((t) => {
        const o = (t ?? {}) as { name?: unknown; rows?: unknown; notes?: unknown };
        const rows = Array.isArray(o.rows) ? (o.rows as unknown[]).map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? "" : String(c))) : [])) : [];
        // 셀 노트(노란 말풍선) [행, 열, 내용] — 구버전 스크립트는 이 칸을 보내지 않는다
        if (Array.isArray(o.notes)) notesSupported = true;
        const notes: [number, number, string][] = Array.isArray(o.notes)
          ? (o.notes as unknown[]).flatMap((n) => {
              if (!Array.isArray(n) || n.length < 3) return [];
              const r = Number(n[0]), c = Number(n[1]), text = n[2] == null ? "" : String(n[2]);
              return Number.isInteger(r) && Number.isInteger(c) && text.trim() ? [[r, c, text] as [number, number, string]] : [];
            })
          : [];
        noteCount += notes.length;
        return { name: String(o.name ?? ""), rows, notes };
      })
    : [];
  const scriptVersion = typeof json.version === "number" ? json.version : notesSupported ? 2 : 1;
  const updatedAt = typeof json.updatedAt === "string" && !Number.isNaN(new Date(json.updatedAt).getTime()) ? new Date(json.updatedAt).toISOString() : null;
  const source = json.source === "cache" || json.source === "live" ? json.source : "";
  return { tabs, url: typeof json.url === "string" ? json.url : null, notesSupported, noteCount, scriptVersion, updatedAt, source };
}
