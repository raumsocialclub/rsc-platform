import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 프로필 진단(/match-check) 사진 1장. 브라우저가 /api/match/upload-url 로 서명 업로드 URL 을 받아 비공개 버킷 match-photos 의
 * inbox/<uuid>/photo.<확장자> 에 직접 올리고, 제출할 때 경로만 보낸다. 서버는 실제로 올라가 있는지 확인한 뒤 inquiries.answers.photo 에 기록한다.
 * 어드민은 /api/admin/inquiries/:id/photo 로 5분짜리 서명 URL 을 받아 본다. 보관은 상담 신청과 같은 180일(purge_expired_inquiries 가 함께 지움).
 */
export const MATCH_PHOTO_BUCKET = "match-photos";
export const MATCH_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const MATCH_PHOTO_EXTS = ["jpg", "jpeg", "png", "webp", "heic", "heif"] as const;
export const MATCH_PHOTO_ACCEPT = "image/*,.heic,.heif";

export const photoExt = (name: string) => (name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "");
export const isPhotoExt = (name: string) => (MATCH_PHOTO_EXTS as readonly string[]).includes(photoExt(name));

/** 업로드 거부 사유. 통과하면 null */
export function photoProblem(name: string, size: number): string | null {
  if (!isPhotoExt(name)) return "jpg · png · webp · heic 사진만 올릴 수 있습니다.";
  if (!Number.isFinite(size) || size <= 0) return "비어 있는 파일은 올릴 수 없습니다.";
  if (size > MATCH_PHOTO_MAX_BYTES) return "사진 크기는 10MB 를 넘을 수 없습니다.";
  return null;
}

export function photoPathFor(name: string): string {
  return `inbox/${crypto.randomUUID()}/photo.${photoExt(name)}`;
}

const PATH_RE = /^inbox\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/photo\.[a-z0-9]{1,5}$/;
export const isPhotoPath = (p: unknown): p is string => typeof p === "string" && PATH_RE.test(p) && isPhotoExt(p);

/** 제출된 경로가 실제로 버킷에 있는지. 없거나 너무 크면 false */
export async function verifyPhoto(client: SupabaseClient, path: string): Promise<boolean> {
  if (!isPhotoPath(path)) return false;
  const dir = path.slice(0, path.lastIndexOf("/"));
  const base = path.slice(path.lastIndexOf("/") + 1);
  const { data, error } = await client.storage.from(MATCH_PHOTO_BUCKET).list(dir, { limit: 5 });
  if (error) return false;
  const obj = (data ?? []).find((o) => o.name === base);
  if (!obj) return false;
  const size = Number((obj.metadata as { size?: number } | null)?.size ?? 0);
  return !(size > MATCH_PHOTO_MAX_BYTES);
}
