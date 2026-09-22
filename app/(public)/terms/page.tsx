import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { getDoc, list, on, s } from "@/lib/cms/get";
import { fromCms, type CmsSection } from "@/lib/legal/content";

export const metadata: Metadata = { title: "이용약관 · RSC" };

/** CMS(site_content legal.terms). 기본값은 lib/legal/content.ts 자리 문구 */
export default async function Page() {
  const d = await getDoc("legal.terms");
  return <LegalPage overline="TERMS" title={s(d, "title")} updated={s(d, "updated")} sections={fromCms(list<CmsSection>(d, "sections"))} current="/terms" placeholder={on(d, "placeholder")} />;
}
