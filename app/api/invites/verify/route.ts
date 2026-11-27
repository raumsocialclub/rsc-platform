import { NextResponse } from "next/server";
import { leadModeGuard } from "@/lib/settings/leadModeGuard";
import { z } from "zod";
import { limitByIp, tooManyResponse } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

/** POST /api/invites/verify { code } → { valid, reason?, name? }  (FLOWS.md 1-3). 코드 무작위 대입 방지: 같은 IP 10분에 20번 */
const Body = z.object({ code: z.string().trim().min(1).max(20) });

export async function POST(req: Request) {
  const closed = await leadModeGuard();
  if (closed) return closed;
  const limited = await limitByIp(req, "invite-verify", 20, 600);
  if (!limited.ok) return tooManyResponse(limited, { valid: false, reason: "RATE_LIMIT" });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: "INVALID_INPUT" }, { status: 400 });
  }
  const code = parsed.data.code.toUpperCase();
  if (!/^RSC-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return NextResponse.json({ valid: false, reason: "FORMAT" });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_invite_code", { p_code: code });
    if (error) {
      console.error("[invites/verify]", error);
      return NextResponse.json({ valid: false, reason: "SERVER" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[invites/verify]", e);
    return NextResponse.json({ valid: false, reason: "SERVER" }, { status: 500 });
  }
}
