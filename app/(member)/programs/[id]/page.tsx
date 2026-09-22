import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramDetail } from "@/components/programs/ProgramDetail";
import { getProgram } from "@/lib/programs/queries";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getProgram(id);
  return { title: p ? `${p.name} · RSC` : "프로그램 · RSC" };
}

/** 프로그램 상세. 비공개 프로그램은 RLS 로 회원에게 안 보이므로 404. */
export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProgram(id);
  if (!p || !p.is_published) notFound();
  return <ProgramDetail p={p} />;
}
