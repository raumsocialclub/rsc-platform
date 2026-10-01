import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/** 관리자 활동 로그 (M9). 실패해도 본 작업을 막지 않는다. */
export async function logAdmin(adminId: string, action: string, target?: string | null, detail?: Record<string, unknown>) {
  try {
    if (!hasServiceRoleKey()) return;
    await createAdminClient().from("admin_logs").insert({ admin_id: adminId, action, target: target ?? null, detail: detail ?? null });
  } catch (e) {
    console.error("[admin/log]", e);
  }
}
