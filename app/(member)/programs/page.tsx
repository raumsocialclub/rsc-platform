import type { Metadata } from "next";
import { ProgramsView } from "@/components/programs/ProgramsView";
import { getCurrentMember } from "@/lib/auth/session";
import { listPrograms, upcomingOnly } from "@/lib/programs/queries";

export const metadata: Metadata = { title: "프로그램 · RSC" };

/** 회원 프로그램 목록: 공개 + 남은 회차가 있는 프로그램만, 카테고리 필터는 ?cat= */
export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const [{ cat }, me, all] = await Promise.all([searchParams, getCurrentMember(), listPrograms()]);
  const programs = upcomingOnly(all);
  return <ProgramsView programs={programs} filter={(cat ?? "ALL").toUpperCase()} greeting={me?.name || null} />;
}
