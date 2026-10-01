import { Header } from "@/components/site/Header";

/** 회원 영역(초대코드·가입·로그인) 공통 틀. deploy/member.html 의 <main> 재현. 푸터 없음. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col pt-[57px] md:pt-[76px]">
      <Header />
      <main className="flex-1 px-[18px] pt-[24px] pb-[96px] md:px-[40px] md:pt-[48px] md:pb-[120px]">
        <div className="w-full max-w-[1100px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
