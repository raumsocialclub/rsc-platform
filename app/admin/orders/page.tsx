import type { Metadata } from "next";
import { OrdersView } from "@/components/admin/OrdersView";
import { getOrder, listOrders } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "예약 · 결제 · RSC ADMIN" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ program?: string; status?: string; id?: string }> }) {
  const { program = "", status = "", id } = await searchParams;
  const supabase = await createClient();
  const [rows, selected, { data: programs }] = await Promise.all([
    listOrders({ program: program || undefined, status: status || undefined }),
    id ? getOrder(id) : Promise.resolve(null),
    supabase.from("programs").select("id, name").order("created_at", { ascending: false }),
  ]);
  return <OrdersView rows={rows} selected={selected} programs={(programs ?? []) as { id: string; name: string }[]} filter={{ program, status }} />;
}
