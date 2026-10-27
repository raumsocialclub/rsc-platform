import { syncCallEvents } from "./events";
import { analyzeInsights } from "./insights";
import { buildLeads, memoGroups, summarize } from "./parse";
import { fetchSheetTabs } from "./sheet";
import type { CallsData } from "./types";

/** 마지막으로 성공한 결과 (서버 인스턴스 안에서만). 시트가 느리거나 잠깐 실패해도 화면이 비지 않게 */
let lastGood: CallsData | null = null;
let inflight: Promise<CallsData> | null = null;

/**
 * 시트 읽기 → 리드 정리 → 변경 기록 → 화면용 묶음. /admin/calls 와 /api/admin/crm-calls 가 같이 쓴다.
 * 동시에 여러 번 불려도 시트는 한 번만 읽고(Apps Script 할당량·속도), 실패하면 마지막 성공분을 stale 로 돌려준다.
 */
export async function loadCallsDataSafe(): Promise<{ data: CallsData | null; error: string | null; stale: boolean }> {
  try {
    const data = await (inflight ??= loadCallsData().finally(() => { inflight = null; }));
    return { data, error: null, stale: false };
  } catch (e) {
    console.error("[crm/load]", e);
    const error = e instanceof Error ? e.message : "시트를 읽지 못했습니다.";
    return { data: lastGood, error, stale: !!lastGood };
  }
}

export async function loadCallsData(): Promise<CallsData> {
  const data = await buildCallsData();
  lastGood = data;
  return data;
}

async function buildCallsData(): Promise<CallsData> {
  const { tabs, url, notesSupported, noteCount, scriptVersion } = await fetchSheetTabs();
  const parsed = buildLeads(tabs);
  const { leads } = parsed;
  const { enabled, events } = await syncCallEvents(leads);
  const names = new Map(leads.map((l) => [l.key, l.name]));
  return {
    ok: true,
    fetchedAt: new Date().toISOString(),
    sheetUrl: url,
    tabs: parsed.tabs,
    leads,
    summary: summarize(leads, parsed.rows),
    memos: memoGroups(leads),
    insights: analyzeInsights(leads),
    events: events.map((e) => ({ ...e, name: names.get(e.key) ?? "" })),
    eventsEnabled: enabled,
    sheet: { notesSupported, noteCount, scriptVersion, masterTab: parsed.masterTab, statusTab: parsed.statusTab, ignoredTabs: parsed.ignoredTabs },
  };
}
