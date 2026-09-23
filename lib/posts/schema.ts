import { z } from "zod";
import { POST_CATEGORIES } from "./types";

/** 어드민 소식 저장 입력 (POST/PUT /api/admin/posts) */
export const PostInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(120, "제목은 120자 이내로 입력해 주세요."),
  slug: z.string().trim().min(1, "주소(슬러그)를 입력해 주세요.").max(80).regex(/^[\p{L}\p{N}-]+$/u, "주소는 글자·숫자·하이픈(-)만 쓸 수 있습니다."),
  category: z.enum(POST_CATEGORIES),
  summary: z.string().trim().max(300, "요약은 300자 이내로 입력해 주세요.").default(""),
  body: z.string().max(50_000, "본문이 너무 깁니다.").default(""),
  cover_image: z.string().trim().max(1000).default(""),
  published: z.boolean().default(false),
  published_at: z.string().trim().default(""),
});
export type PostInput = z.infer<typeof PostInputSchema>;

export function firstIssue(err: z.ZodError): string {
  return err.issues[0]?.message ?? "입력값을 확인해 주세요.";
}
