import { DOCS, PAGES, type DocDef } from "./schema";
import type { DocData } from "./get";

export type SearchHit = { docId: string; docLabel: string; page: DocDef["page"]; pageLabel: string; field: string; snippet: string };

/** 검색어 앞뒤를 잘라 짧은 미리보기로 */
function snippet(text: string, q: string, span = 46): string {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, span * 2);
  const a = Math.max(0, i - span), b = Math.min(text.length, i + q.length + span);
  return `${a > 0 ? "…" : ""}${text.slice(a, b).replace(/\n/g, " ")}${b < text.length ? "…" : ""}`;
}

/**
 * 어드민 「문구 검색」: 사이트 관리 문서(브랜드·메인·소셜클럽·1:1 매칭·상담 신청·소식·가격·혜택·약관)의 현재 값에서 검색어를 찾아
 * 어느 탭 → 어느 섹션 → 어느 항목인지 알려준다. 사이트에서 본 문장을 그대로 붙여 넣어 찾는 용도라 대소문자·줄바꿈은 무시한다.
 */
export function searchDocs(docs: Record<string, DocData>, qRaw: string, limit = 40): SearchHit[] {
  const q = qRaw.trim().replace(/\s+/g, " ");
  if (q.length < 1) return [];
  const pageLabel = new Map(PAGES.map((p) => [p.key, p.label]));
  const norm = (v: string) => v.replace(/\s+/g, " ");
  const hits: SearchHit[] = [];
  for (const def of DOCS) {
    if (def.hidden || !pageLabel.has(def.page)) continue;
    const data = docs[def.id];
    if (!data) continue;
    const push = (field: string, v: unknown) => {
      if (typeof v !== "string" || !v) return;
      const nv = norm(v);
      if (!nv.toLowerCase().includes(q.toLowerCase())) return;
      hits.push({ docId: def.id, docLabel: def.label, page: def.page, pageLabel: pageLabel.get(def.page)!, field, snippet: snippet(nv, q) });
    };
    for (const f of def.fields) push(f.label, data[f.key]);
    for (const l of def.lists ?? []) {
      const arr = Array.isArray(data[l.key]) ? (data[l.key] as Record<string, unknown>[]) : [];
      arr.forEach((it, i) => { for (const f of l.fields) push(`${l.itemLabel} ${i + 1} · ${f.label}`, it[f.key]); });
    }
    if (hits.length >= limit) break;
  }
  return hits.slice(0, limit);
}
