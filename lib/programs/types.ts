/** 프로그램 도메인 타입 (SCHEMA.sql programs / sessions / session_availability) */
export type ProgramKind = "single" | "season";

export type FlowItem = { t: string; d: string };

export type Program = {
  id: string;
  kind: ProgramKind;
  name: string;
  subtitle: string | null;
  category: string | null;
  place: string | null;
  short_desc: string | null;
  description: string | null;
  image_url: string | null;
  flow: FlowItem[];
  capacity: number;
  price: number;
  member_price: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Session = {
  id: string;
  program_id: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  seq: number;
  status: "open" | "closed" | "cancelled";
  /** session_availability.remaining (없으면 capacity) */
  remaining: number;
};

export type ProgramWithSessions = Program & { sessions: Session[] };

/** 카테고리 (SCHEMA.sql 주석: WELLNESS | WINE | SOCIAL | CULTURE | SOLO) */
export const CATEGORIES = ["WELLNESS", "WINE", "SOCIAL", "CULTURE"] as const;
export const SEASON_CATEGORY = "SOLO";
export const SEASON_WEEKS = 6;

/** 화면 표시용 카테고리 라벨. 시즌(SOLO)은 프로토타입대로 "RAUM SOLO" */
export function categoryLabel(cat: string | null | undefined): string {
  if (!cat) return "";
  return cat === SEASON_CATEGORY ? "RAUM SOLO" : cat;
}

/** 회원이 실제로 내는 가격 (회원가가 있으면 회원가) — reserve_seat 와 같은 규칙 */
export function memberPrice(p: Pick<Program, "price" | "member_price">): number {
  return p.member_price ?? p.price;
}

export function normalizeFlow(raw: unknown): FlowItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({ t: String(x.t ?? ""), d: String(x.d ?? "") }));
}
