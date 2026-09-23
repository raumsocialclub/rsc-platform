/** 소식 게시판 (M11). 클라이언트에서도 import 가능 — 서버 전용 모듈을 넣지 않는다. */
export type Post = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  body: string;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export const POST_CATEGORIES = ["소식", "프로그램", "행사 후기", "공지"] as const;
export const POST_PAGE_SIZE = 12;

/** 제목 → 주소용 슬러그. 한글은 그대로 두고(네이버·구글 모두 인식) 공백은 '-', 기호는 제거 */
export function slugify(v: string): string {
  return v
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** 마크다운 기호를 걷어낸 미리보기 텍스트 */
export function plainText(md: string, max = 160): string {
  const t = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}.${g("month")}.${g("day")}`;
}
