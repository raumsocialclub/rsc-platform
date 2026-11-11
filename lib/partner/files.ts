import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 제휴문의 첨부 파일 규칙. 브라우저가 /api/partner/upload-url 로 서명 업로드 URL 을 받아 partner-files 버킷(비공개)에 직접 올리고,
 * 제출할 때 [{path, name, size}] 를 보내면 서버가 실제로 올라가 있는지 확인한 뒤 partner_inquiries.files 에 기록한다.
 */
export const PARTNER_FILES_BUCKET = "partner-files";
export const PARTNER_FILE_MAX = 3;
export const PARTNER_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const PARTNER_FILE_EXTS = ["pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png"] as const;
/** <input accept> 용 */
export const PARTNER_FILE_ACCEPT = PARTNER_FILE_EXTS.map((e) => `.${e}`).join(",");

export type PartnerFile = { path: string; name: string; size: number };

export const fileExt = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "");
export const isAllowedExt = (name: string) => (PARTNER_FILE_EXTS as readonly string[]).includes(fileExt(name));

/** 업로드 거부 사유. 통과하면 null */
export function fileProblem(name: string, size: number): string | null {
  if (!isAllowedExt(name)) return "PDF, HWP, Word, Excel, PowerPoint, JPG, PNG 파일만 첨부할 수 있습니다.";
  if (!Number.isFinite(size) || size <= 0) return "비어 있는 파일은 첨부할 수 없습니다.";
  if (size > PARTNER_FILE_MAX_BYTES) return "파일 하나의 크기는 10MB 를 넘을 수 없습니다.";
  return null;
}

/** 저장 파일명: 경로 문자·제어 문자 제거, 120자 제한. 한글은 그대로 둔다 */
export function safeFileName(name: string): string {
  const base = name.replace(/^.*[\\/]/, "").replace(/[\u0000-\u001f<>:"|?*]/g, "").trim();
  const ext = fileExt(base);
  const stem = base.slice(0, base.length - ext.length - 1).slice(0, 100) || "file";
  return `${stem}.${ext}`;
}

/** 새 업로드 경로 inbox/<uuid>/<파일명> */
export function uploadPathFor(name: string): string {
  return `inbox/${crypto.randomUUID()}/${safeFileName(name)}`;
}

const PATH_RE = /^inbox\/[0-9a-f-]{36}\/[^/]{1,130}$/;
export const isUploadPath = (p: string) => PATH_RE.test(p) && isAllowedExt(p);

/**
 * 제출된 파일 목록이 실제로 버킷에 올라가 있는지 확인하고, 이름·크기를 버킷 기준으로 맞춰 돌려준다. 하나라도 없으면 null.
 * (브라우저가 보내는 size 는 참고값일 뿐이라 버킷의 metadata.size 를 쓴다)
 */
export async function verifyFiles(client: SupabaseClient, files: PartnerFile[]): Promise<PartnerFile[] | null> {
  const out: PartnerFile[] = [];
  for (const f of files) {
    if (!isUploadPath(f.path)) return null;
    const dir = f.path.slice(0, f.path.lastIndexOf("/"));
    const base = f.path.slice(f.path.lastIndexOf("/") + 1);
    const { data, error } = await client.storage.from(PARTNER_FILES_BUCKET).list(dir, { limit: 10 });
    if (error) return null;
    const obj = (data ?? []).find((o) => o.name === base);
    if (!obj) return null;
    const size = Number((obj.metadata as { size?: number } | null)?.size ?? f.size) || f.size;
    if (size > PARTNER_FILE_MAX_BYTES) return null;
    out.push({ path: f.path, name: safeFileName(f.name || base), size });
  }
  return out;
}
