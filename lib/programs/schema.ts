import { z } from "zod";
import { CATEGORIES, SEASON_CATEGORY, SEASON_WEEKS } from "./types";

/** 어드민 프로그램 등록/수정 입력값 (API 와 폼이 공유) */
export const FlowItemSchema = z.object({ t: z.string().trim().max(40), d: z.string().trim().max(200) });

export const ProgramInputSchema = z
  .object({
    kind: z.enum(["single", "season"]),
    name: z.string().trim().min(1, "프로그램 이름을 입력해 주세요.").max(80),
    subtitle: z.string().trim().max(80).optional().default(""),
    category: z.enum([...CATEGORIES, SEASON_CATEGORY]),
    place: z.string().trim().max(80).optional().default(""),
    short_desc: z.string().trim().max(200).optional().default(""),
    description: z.string().trim().max(5000).optional().default(""),
    image_url: z.string().trim().url().optional().or(z.literal("")).default(""),
    flow: z.array(FlowItemSchema).max(20).default([]),
    capacity: z.number().int().min(1, "정원은 1명 이상이어야 합니다.").max(1000),
    price: z.number().int().min(0).max(100_000_000),
    member_price: z.number().int().min(0).max(100_000_000).nullable().default(null),
    /** ISO 문자열. 단일 1개 / 시즌 6개 */
    sessions: z.array(z.string().datetime({ offset: true })).min(1, "일정을 입력해 주세요.").max(12),
    is_published: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "single" && v.sessions.length !== 1) ctx.addIssue({ code: "custom", path: ["sessions"], message: "단일 프로그램은 일정이 1개입니다." });
    if (v.kind === "season" && v.sessions.length !== SEASON_WEEKS) ctx.addIssue({ code: "custom", path: ["sessions"], message: `시즌 프로그램은 ${SEASON_WEEKS}주 일정을 모두 입력해 주세요.` });
    if (v.member_price != null && v.member_price > v.price) ctx.addIssue({ code: "custom", path: ["member_price"], message: "회원가는 판매가보다 클 수 없습니다." });
  });

export type ProgramInput = z.infer<typeof ProgramInputSchema>;

/** zod 오류 → 첫 메시지 */
export function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "입력값을 확인해 주세요.";
}
