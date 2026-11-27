import { revalidatePath } from "next/cache";
import type { PopupInput } from "./schema";
import { toKstIso } from "@/lib/programs/format";

/** 23:59 → 23:59:59 */
const endOfDay = (iso: string | null) => (iso ? new Date(Date.parse(iso) + 59_000).toISOString() : null);

/** 입력값 → DB 행. 시작일은 그날 00:00, 종료일은 그날 23:59:59 (한국 시간) */
export function toRow(input: PopupInput) {
  return {
    title: input.title,
    image_url: input.image_url,
    ratio: input.ratio,
    link_url: input.link_url || null,
    starts_at: input.starts_at ? toKstIso(input.starts_at, "00:00") : null,
    ends_at: input.ends_at ? endOfDay(toKstIso(input.ends_at, "23:59")) : null,
    active: input.active,
    sort_order: input.sort_order,
  };
}

/** 팝업 저장 후 홈 캐시 갱신 */
export function revalidateHome() {
  revalidatePath("/");
}
