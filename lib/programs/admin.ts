// 서버 전용 (Route Handler 에서만 import)
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramInput } from "./schema";

/**
 * 프로그램 저장 (관리자 세션의 RLS 를 그대로 사용 — service role 불필요).
 * 회차(sessions)는 seq 기준으로 갱신: 있으면 날짜·정원 수정, 없으면 추가, 남는 회차는 예약이 없을 때만 삭제(있으면 취소 처리).
 */
export async function saveProgram(supabase: SupabaseClient, input: ProgramInput, id?: string): Promise<{ id: string } | { error: string }> {
  const row = {
    kind: input.kind,
    name: input.name,
    subtitle: input.subtitle || null,
    category: input.category,
    place: input.place || null,
    short_desc: input.short_desc || null,
    description: input.description || null,
    image_url: input.image_url || null,
    flow: input.flow.filter((f) => f.t || f.d),
    capacity: input.capacity,
    price: input.price,
    member_price: input.member_price,
    is_published: input.is_published,
  };

  let programId = id;
  if (programId) {
    const { error } = await supabase.from("programs").update(row).eq("id", programId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase.from("programs").insert(row).select("id").single();
    if (error || !data) return { error: error?.message ?? "insert failed" };
    programId = data.id as string;
  }

  const { data: existing } = await supabase.from("sessions").select("id, seq").eq("program_id", programId).order("seq");
  const bySeq = new Map<number, string>((existing ?? []).map((s) => [s.seq as number, s.id as string]));
  const wanted = [...input.sessions].sort();

  for (let i = 0; i < wanted.length; i++) {
    const seq = i + 1;
    const sid = bySeq.get(seq);
    const values = { starts_at: wanted[i], capacity: input.capacity, seq, status: "open" };
    if (sid) {
      const { error } = await supabase.from("sessions").update(values).eq("id", sid);
      if (error) return { error: error.message };
      bySeq.delete(seq);
    } else {
      const { error } = await supabase.from("sessions").insert({ ...values, program_id: programId });
      if (error) return { error: error.message };
    }
  }
  // 남는 회차: 예약이 없으면 삭제, 있으면 취소
  for (const sid of bySeq.values()) {
    const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("session_id", sid);
    if (count) await supabase.from("sessions").update({ status: "cancelled" }).eq("id", sid);
    else await supabase.from("sessions").delete().eq("id", sid);
  }
  return { id: programId };
}
