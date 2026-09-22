import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_UPDATED, REFUND } from "@/lib/legal/content";

export const metadata: Metadata = { title: "환불규정 · RSC" };

export default function Page() {
  return <LegalPage overline="REFUND" title="취소 · 환불 규정" updated={LEGAL_UPDATED} sections={REFUND} current="/refund" />;
}
