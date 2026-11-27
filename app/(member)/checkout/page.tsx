import { redirect } from "next/navigation";

/** /checkout 직접 접근 → 프로그램 목록. 결제는 /checkout/[bookingId] 에서. */
export default function CheckoutIndex() {
  redirect("/programs");
}
