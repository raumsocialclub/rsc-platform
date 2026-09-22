import type { Metadata } from "next";
import { BookingList } from "@/components/my/BookingList";
import { getCurrentMember } from "@/lib/auth/session";
import { listMyBookingsWithNow } from "@/lib/bookings/queries";
import { getRefundRules } from "@/lib/bookings/refund";

export const metadata: Metadata = { title: "내 예약 · RSC" };

/** 내 예약: 다가오는/지난 탭, 취소(환불 정책 적용), 미결제 예약 이어하기 */
export default async function MyPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, me, { bookings, now }, rules] = await Promise.all([searchParams, getCurrentMember(), listMyBookingsWithNow(), getRefundRules()]);
  return <BookingList bookings={bookings} tab={tab === "past" ? "past" : "upcoming"} name={me?.name ?? ""} now={now} rules={rules} />;
}
