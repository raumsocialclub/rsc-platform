/** 어드민 표시용 포맷 */
export function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const base = `${y}.${String(m).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
  if (!withTime) return base;
  return `${base} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export const INQUIRY_STATUS: Record<string, string> = {
  pending: "대기",
  contacted: "상담 진행",
  invited: "초대 완료",
  closed: "보류",
};

/** 상태 배지 색 (Design.md 배지 규칙 + 프로토타입 statusStyle) */
export function badgeStyle(kind: "ok" | "warn" | "mute" | "bad" | "brand"): { background: string; color: string } {
  switch (kind) {
    case "ok": return { background: "rgba(46,107,62,.12)", color: "#2e6b3e" };
    case "warn": return { background: "rgba(226,180,120,.25)", color: "#7a5420" };
    case "bad": return { background: "rgba(163,64,44,.12)", color: "#a3402c" };
    case "brand": return { background: "#5a3d24", color: "#f7f3ec" };
    default: return { background: "rgba(33,30,25,.07)", color: "rgba(33,30,25,.6)" };
  }
}

export function inquiryBadge(status: string) {
  if (status === "pending") return badgeStyle("warn");
  if (status === "invited") return badgeStyle("brand");
  if (status === "contacted") return badgeStyle("ok");
  return badgeStyle("mute");
}

/** 예약 상태 배지 (M7) */
export function orderBadge(status: "pending" | "confirmed" | "cancelled" | "expired" | "attended"): { background: string; color: string } {
  const map = { confirmed: "ok", attended: "mute", pending: "warn", cancelled: "bad", expired: "mute" } as const;
  return badgeStyle(map[status]);
}

/** 회원 상태 배지 (M7) */
export function memberBadge(status: "active" | "paused" | "withdrawn"): { background: string; color: string } {
  return badgeStyle(status === "active" ? "ok" : status === "paused" ? "warn" : "bad");
}
