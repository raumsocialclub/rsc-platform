import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_UPDATED, TERMS } from "@/lib/legal/content";

export const metadata: Metadata = { title: "이용약관 · RSC" };

export default function Page() {
  return <LegalPage overline="TERMS" title="RAUM SOCIAL CLUB 이용약관" updated={LEGAL_UPDATED} sections={TERMS} current="/terms" />;
}
