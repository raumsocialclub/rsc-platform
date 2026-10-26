import { syncCallEvents } from "./events";
import { analyzeInsights } from "./insights";
import { memoGroups, parseTabs, summarize } from "./parse";
import { fetchSheetTabs } from "./sheet";
import type { CallsData } from "./types";

/** 시트 읽기 → 리드 정리 → 변경 기록 → 화면용 묶음. /admin/calls 와 /api/admin/crm-calls 가 같이 쓴다 */
export async function loadCallsData(): Promise<CallsData> {
  const { tabs, url } = await fetchSheetTabs();
  const leads = parseTabs(tabs);
  const { enabled, events } = await syncCallEvents(leads);
  const names = new Map(leads.map((l) => [l.key, l.name]));
  return {
    ok: true,
    fetchedAt: new Date().toISOString(),
    sheetUrl: url,
    tabs: tabs.map((t) => t.name),
    leads,
    summary: summarize(leads),
    memos: memoGroups(leads),
    insights: analyzeInsights(leads),
    events: events.map((e) => ({ ...e, name: names.get(e.key) ?? "" })),
    eventsEnabled: enabled,
  };
}
