import { CopyButton } from "./CopyButton";
import { fmtDate } from "@/lib/admin/format";

/** 발급된 초대코드 표시 + 복사. 이메일 발송 결과도 함께 보여준다. */
export function IssuedCodeBox({ code, expiresAt, notify }: { code: string; expiresAt?: string | null; notify?: { sent: boolean; reason?: string } }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const link = `${site}/join?code=${code}`;
  return (
    <div className="bg-cream border border-[rgba(33,30,25,.14)] p-[16px]">
      <div className="text-[11px] tracking-[.2em] text-brownHover mb-[8px]">초대코드 발급 완료</div>
      <div className="flex items-center justify-between gap-[10px]">
        <b className="text-[20px] tracking-[.14em]">{code}</b>
        <CopyButton text={code} />
      </div>
      <div className="text-[12px] text-[rgba(33,30,25,.55)] mt-[8px]">유효기간 {expiresAt ? fmtDate(expiresAt) : "발급 후 30일"} 까지</div>
      <div className="flex items-center justify-between gap-[10px] mt-[10px] text-[12px] text-[rgba(33,30,25,.65)]">
        <span className="truncate">{link}</span>
        <CopyButton text={link} label="링크 복사" />
      </div>
      <div className="text-[12px] mt-[10px] text-[rgba(33,30,25,.55)]">
        {notify?.sent ? "이메일로 발송했습니다." : "이메일 발송은 준비 중입니다. 코드를 직접 전달해 주세요."}
      </div>
    </div>
  );
}
