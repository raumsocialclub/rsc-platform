import { createClient } from "@/lib/supabase/server";
import { POPUP_MAX_LIVE, popupState, type Popup } from "./types";

const COLS = "id, title, image_url, ratio, link_url, starts_at, ends_at, active, sort_order, created_at, updated_at";

/** 어드민 목록 전체 (순서 → 최근 등록순). RLS: 관리자는 전부 */
export async function listAllPopups(): Promise<Popup[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("popups").select(COLS).order("sort_order").order("created_at", { ascending: false });
  return (data ?? []) as Popup[];
}

/** 홈에 지금 보여 줄 팝업 (켜짐 + 기간 안). RLS "popups public read" 가 같은 조건을 거르고, 여기서 한 번 더 확인 */
export async function listLivePopups(): Promise<Popup[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("popups").select(COLS).eq("active", true).order("sort_order").order("created_at", { ascending: false }).limit(20);
    const now = new Date();
    return ((data ?? []) as Popup[]).filter((p) => popupState(p, now) === "live").slice(0, POPUP_MAX_LIVE);
  } catch {
    return [];
  }
}
