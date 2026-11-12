import type { Metadata } from "next";
import { ProgramForm } from "@/components/admin/ProgramForm";

export const metadata: Metadata = { title: "새 프로그램" };

export default async function NewProgramPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  return <ProgramForm kind={kind === "season" ? "season" : "single"} />;
}
