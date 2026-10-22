import { z } from "zod";
import { POPUP_RATIO_KEYS } from "./types";

const DATE = /^(\d{4}-\d{2}-\d{2})?$/;

/** 어드민 팝업 저장 입력 (POST /api/admin/popups, PUT /api/admin/popups/[id]) */
export const PopupInputSchema = z
  .object({
    title: z.string().trim().min(1, "팝업 이름을 입력해 주세요.").max(80, "이름은 80자 이내로 입력해 주세요."),
    image_url: z.string().trim().url("이미지를 먼저 올려 주세요.").max(1000),
    ratio: z.enum(POPUP_RATIO_KEYS as [string, ...string[]], { message: "비율을 선택해 주세요." }),
    link_url: z.string().trim().max(1000).default("").refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "링크는 / 로 시작하는 사이트 안 주소나 http(s):// 주소여야 합니다."),
    starts_at: z.string().trim().regex(DATE, "시작일 형식이 올바르지 않습니다.").default(""),
    ends_at: z.string().trim().regex(DATE, "종료일 형식이 올바르지 않습니다.").default(""),
    active: z.boolean().default(true),
    sort_order: z.number().int().min(0).max(999).default(0),
  })
  .refine((v) => !v.starts_at || !v.ends_at || v.starts_at <= v.ends_at, { message: "종료일이 시작일보다 빠릅니다.", path: ["ends_at"] });
export type PopupInput = z.infer<typeof PopupInputSchema>;

/** 켜기/끄기만 바꾸는 입력 (PATCH) */
export const PopupPatchSchema = z.object({ active: z.boolean() });

export function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "입력값을 확인해 주세요.";
}
