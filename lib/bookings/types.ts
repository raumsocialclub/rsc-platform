export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired" | "attended";
export type PaymentStatus = "ready" | "paid" | "cancelled" | "partial_cancelled" | "failed";

export type Booking = {
  id: string;
  order_id: string;
  member_id: string;
  program_id: string;
  session_id: string;
  qty: number;
  unit_price: number;
  amount: number;
  status: BookingStatus;
  expires_at: string;
  cancelled_at: string | null;
  created_at: string;
};

export type BookingDetail = Booking & {
  program: { id: string; kind: "single" | "season"; name: string; subtitle: string | null; place: string | null; image_url: string | null; category: string | null };
  session: { id: string; starts_at: string; seq: number; status: string };
  payment: { id: string; payment_key: string | null; method: string | null; amount: number; status: PaymentStatus; receipt_url: string | null; approved_at: string | null } | null;
};

export const BOOKING_STATUS_KO: Record<BookingStatus, string> = {
  pending: "결제 대기",
  confirmed: "예약 확정",
  cancelled: "취소됨",
  expired: "만료",
  attended: "참여 완료",
};
