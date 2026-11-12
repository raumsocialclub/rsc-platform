import type { Metadata } from "next";
import { MembersView } from "@/components/admin/MembersView";
import { filterMembers, listMembers, listOrders } from "@/lib/admin/queries";
import { getCurrentMember, isOwnerRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "회원 DB" };

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; id?: string }> }) {
  const { q = "", status = "", id } = await searchParams;
  const all = await listMembers();
  const rows = filterMembers(all, q, status);
  const selected = id ? all.find((m) => m.id === id) ?? null : null;
  const selectedOrders = selected ? await listOrders({ member: selected.id, limit: 50 }) : [];
  return <MembersView rows={rows} total={all.length} selected={selected} selectedOrders={selectedOrders} filter={{ q, status }} canExport={isOwnerRole(await getCurrentMember())} />;
}
