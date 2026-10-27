import { syncCallEvents } from "./events";
import { analyzeInsights } from "./insights";
import { buildLeads, memoGroups, summarize } from "./parse";
import { fetchSheetTabs } from "./sheet";
import type { CallsData } from "./types";

/** 시트 읽기 → 리드 정리 → 변경 기록 → 화면용 묶음. /admin/calls 와 /api/admin/crm-calls 가 같이 쓴다 */
export async function loadCallsData(): Promise<CallsData> {
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
