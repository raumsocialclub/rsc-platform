import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_UPDATED, PRIVACY } from "@/lib/legal/content";

export const metadata: Metadata = { title: "개인정보처리방침 · RSC" };

export default function Page() {
  return <LegalPage overline="PRIVACY" title="개인정보처리방침" updated={LEGAL_UPDATED} sections={PRIVACY} current="/privacy" />;
}
