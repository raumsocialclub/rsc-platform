import { SETTINGS_DOCS } from "./schema";
import type { Settings } from "./get";

/**
 * proxy(요청 앞단)용 설정 로더. Supabase REST 를 anon 키로 직접 읽고(공개 read 정책) 30초 메모리 캐시.
 * DB 를 못 읽으면 기본값으로 동작한다(사이트가 멈추지 않게).
 */
let cache: { at: number; value: Settings } | null = null;
const TTL = 30_000;

export function defaultSettings(): Settings {
  const out: Record<string, unknown> = {};
  for (const d of SETTINGS_DOCS) Object.assign(out, d.defaults);
  return out as Settings;
}

export async function loadSettingsEdge(): Promise<Settings> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const base = defaultSettings();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return base;
  try {
    const ids = SETTINGS_DOCS.map((d) => d.id).join(",");
    const res = await fetch(`${url}/rest/v1/site_content?select=id,data&id=in.(${ids})`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const rows = (await res.json()) as { id: string; data: Record<string, unknown> }[];
      for (const r of rows) for (const [k, v] of Object.entries(r.data ?? {})) if (v != null) (base as Record<string, unknown>)[k] = v;
    }
  } catch {}
  cache = { at: Date.now(), value: base };
  return base;
}

/** 차단·점검 안내 페이지 (외부 CSS 없이 브랜드 색으로) */
export function noticeHtml(title: string, message: string, status: number): Response {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f3ec;color:#211e19;font-family:Arial,sans-serif;padding:24px}
.b{max-width:520px;text-align:center}.o{font-size:11px;letter-spacing:.3em;color:rgba(33,30,25,.5);margin-bottom:18px}h1{font-weight:500;font-size:26px;margin:0 0 14px}p{font-size:14.5px;line-height:1.75;color:rgba(33,30,25,.65);white-space:pre-line;margin:0}</style></head>
<body><div class="b"><div class="o">RAUM SOCIAL CLUB</div><h1>${esc(title)}</h1><p>${esc(message)}</p></div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
