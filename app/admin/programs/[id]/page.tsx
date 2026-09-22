import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramForm } from "@/components/admin/ProgramForm";
import { getProgram } from "@/lib/programs/queries";

export const metadata: Metadata = { title: "프로그램 편집 · RSC ADMIN" };

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getProgram(id);
  if (!program) notFound();
  return <ProgramForm key={program.updated_at} kind={program.kind} program={program} />;
}
