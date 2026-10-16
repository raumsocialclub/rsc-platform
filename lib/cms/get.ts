import { createClient } from "@/lib/supabase/server";
import { DOCS, DOC_BY_ID, type DocDef } from "./schema";
import { LEGAL_DEFAULT_SECTIONS } from "@/lib/legal/content";

export type DocData = Record<string, unknown>;

/** 기본값 위에 DB 값을 덮어쓴다(얕은 병합: 리스트는 통째로 교체). 약관 조항 기본값은 lib/legal/content.ts */
export function mergeDoc(def: DocDef, dbData: DocData | null | undefined): DocData {
  const base: DocData = { ...def.defaults };
  if (def.page === "legal") {
    const k = def.id.split(".")[1] as keyof typeof LEGAL_DEFAULT_SECTIONS;
    base.sections = LEGAL_DEFAULT_SECTIONS[k] ?? [];
  }
  if (!dbData) return base;
  const out: DocData = { ...base };
  for (const [k, v] of Object.entries(dbData)) if (v !== undefined && v !== null) out[k] = v;
  return out;
}

async function loadRows(ids: string[]): Promise<Map<string, DocData>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_content").select("id, data").in("id", ids);
    return new Map((data ?? []).map((r) => [r.id as string, (r.data ?? {}) as DocData]));
  } catch {
    return new Map();
  }
}

/** 한 페이지의 문서들을 id → data 로 */
export async function getPageDocs(page: DocDef["page"] | DocDef["page"][]): Promise<Record<string, DocData>> {
  const pages = Array.isArray(page) ? page : [page];
  const defs = DOCS.filter((d) => pages.includes(d.page));
  const rows = await loadRows(defs.map((d) => d.id));
  const out: Record<string, DocData> = {};
  for (const d of defs) out[d.id] = mergeDoc(d, rows.get(d.id));
  return out;
}

export async function getDoc(id: string): Promise<DocData> {
  const def = DOC_BY_ID.get(id);
  if (!def) return {};
  const rows = await loadRows([id]);
  return mergeDoc(def, rows.get(id));
}

/** 문자열 접근 헬퍼 */
export const s = (d: DocData, k: string): string => (typeof d[k] === "string" ? (d[k] as string) : d[k] == null ? "" : String(d[k]));
export const list = <T = Record<string, string>>(d: DocData, k: string): T[] => (Array.isArray(d[k]) ? (d[k] as T[]) : []);
export const on = (d: DocData, k: string): boolean => d[k] !== false;

export type Theme = { cream: string; ink: string; brown: string; brownHover: string; gold: string; goldHover: string; sand: string; sandDeep: string };
export async function getTheme(): Promise<Theme> {
  const d = await getDoc("global.theme");
  const def = DOC_BY_ID.get("global.theme")!.defaults as Theme;
  const pick = (k: keyof Theme) => (/^#[0-9a-f]{6}$/i.test(s(d, k)) ? s(d, k) : def[k]);
  return { cream: pick("cream"), ink: pick("ink"), brown: pick("brown"), brownHover: pick("brownHover"), gold: pick("gold"), goldHover: pick("goldHover"), sand: pick("sand"), sandDeep: pick("sandDeep") };
}

export type Brand = Record<string, string>;
export async function getBrand(): Promise<Brand> {
  const d = await getDoc("global.brand");
  const out: Brand = {};
  for (const [k, v] of Object.entries(d)) out[k] = typeof v === "string" ? v : "";
  return out;
}
