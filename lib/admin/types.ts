import type { BookingStatus, PaymentStatus } from "@/lib/bookings/types";

/** 어드민 화면 공용 타입·라벨 (클라이언트 컴포넌트에서도 import 가능 — 서버 모듈 의존 없음) */
export type PaymentInfo = {
  id: string;
  payment_key: string | null;
  method: string | null;
  amount: number;
  status: PaymentStatus;
  receipt_url: string | null;
  approved_at: string | null;
  cancelled_at: string | null;
  /** 남은(환불 가능) 금액 */
  balance: number;
};

export type OrderRow = {
  id: string;
  order_id: string;
  created_at: string;
  status: BookingStatus;
  qty: number;
  unit_price: number;
  amount: number;
  cancelled_at: string | null;
  expires_at: string;
  member: { id: string; name: string; email: string | null; phone: string | null } | null;
  program: { id: string; name: string; kind: string; place: string | null } | null;
  session: { id: string; starts_at: string } | null;
  payment: PaymentInfo | null;
};

export type MemberStatus = "active" | "paused" | "withdrawn";
export type MemberRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "member" | "admin";
  status: MemberStatus;
  provider: string;
  memo: string | null;
  created_at: string;
  invite_code: string | null;
  visits: number;
  spent: number;
};

export const MEMBER_STATUS_KO: Record<MemberStatus, string> = { active: "활동", paused: "휴면", withdrawn: "탈퇴" };
export const PROVIDER_KO: Record<string, string> = { email: "이메일", kakao: "카카오", google: "구글", naver: "네이버" };
