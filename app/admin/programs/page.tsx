import type { Metadata } from "next";
import { ProgramsTable, type ProgramTab } from "@/components/admin/ProgramsTable";
import { listPrograms } from "@/lib/programs/queries";

export const metadata: Metadata = { title: "프로그램 관리" };

export default async function AdminProgramsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const t: ProgramTab = tab === "single" || tab === "season" ? tab : "all";
  const programs = await listPrograms();
  return <ProgramsTable programs={programs} tab={t} />;
}
