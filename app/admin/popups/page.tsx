import type { Metadata } from "next";
import { PopupsAdmin } from "@/components/admin/PopupsAdmin";
import { listAllPopups } from "@/lib/popups/queries";

export const metadata: Metadata = { title: "팝업" };

/** 홈 팝업 관리 (M17): 1:1 · 4:5 사진 등록, 기간·링크·순서, 켜기/끄기, 미리보기 */
export default async function AdminPopupsPage() {
  return <PopupsAdmin popups={await listAllPopups()} />;
}
