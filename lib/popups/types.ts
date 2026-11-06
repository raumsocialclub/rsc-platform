/** 홈 팝업 (M17). 클라이언트에서도 import 가능 — 서버 전용 모듈을 넣지 않는다. */
export type PopupRatio = "1:1" | "4:5";

/** 등록 가능한 비율. 업로드 시 이 크기로 가운데 기준 자르기·축소해 저장한다 */
export const POPUP_RATIOS: Record<PopupRatio, { label: string; w: number; h: number; hint: string }> = {
  "1:1": { label: "정사각형", w: 1000, h: 1000, hint: "1000 × 1000" },
  "4:5": { label: "인스타그램 피드", w: 1080, h: 1350, hint: "1080 × 1350" },
};
export const POPUP_RATIO_KEYS = Object.keys(POPUP_RATIOS) as PopupRatio[];
/** 한 번에 보여 줄 최대 팝업 수 */
export const POPUP_MAX_LIVE = 5;

export type Popup = {
  id: string;
  title: string;
  image_url: string;
  ratio: PopupRatio;
  link_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PopupState = "live" | "scheduled" | "ended" | "off";
export const POPUP_STATE_KO: Record<PopupState, string> = { live: "노출 중", scheduled: "예약됨", ended: "종료", off: "꺼짐" };

/** 지금 홈에 보이는지. 꺼짐 > 시작 전 > 종료 후 순으로 판정 */
export function popupState(p: Pick<Popup, "active" | "starts_at" | "ends_at">, now = new Date()): PopupState {
  if (!p.active) return "off";
  if (p.starts_at && new Date(p.starts_at) > now) return "scheduled";
  if (p.ends_at && new Date(p.ends_at) < now) return "ended";
  return "live";
}

/** CSS aspect-ratio 값 */
export function ratioCss(r: PopupRatio): string {
  const { w, h } = POPUP_RATIOS[r];
  return `${w} / ${h}`;
}
