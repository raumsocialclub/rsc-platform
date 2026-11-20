"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; badge?: number };

type Props = { items: AdminNavItem[]; user: { name: string; email: string; initial: string; roleLabel?: string } };

const INK_FILTER = "invert(1) brightness(0.15)";

/** 어드민 사이드바 (Wanted DS). 흰 배경 · 오른쪽 얇은 선 · 선택 메뉴는 연파랑 배경 + 파란 글자. 900px 이하에서는 가로 스크롤 바로 바뀐다. */
export function AdminSidebar({ items, user }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside className="bg-white border-b min-[901px]:border-b-0 min-[901px]:border-r border-lineAlt flex flex-row items-center gap-[12px] overflow-x-auto scrollbar-none px-[12px] py-[10px] min-[901px]:sticky min-[901px]:top-0 min-[901px]:h-screen min-[901px]:flex-col min-[901px]:items-stretch min-[901px]:overflow-y-auto min-[901px]:px-[16px] min-[901px]:py-[24px]">
      <Link href="/admin" className="flex items-center gap-[10px] px-[8px] min-[901px]:mb-[28px] flex-none">
        <Image src="/images/logo-emblem.png" alt="RSC" width={529} height={638} className="h-[28px] w-auto" style={{ filter: INK_FILTER }} />
        <div className="hidden min-[901px]:block">
          <div className="text-[13px] font-bold text-label tracking-[.02em]">RSC ADMIN</div>
          <div className="text-[11px] text-labelAlt mt-[1px]">라움소셜클럽 관리자</div>
        </div>
      </Link>
      <nav className="flex flex-row gap-[4px] min-[901px]:flex-col min-[901px]:flex-1">
        {items.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between gap-[10px] px-[12px] py-[9px] rounded-ds-sm text-[14px] whitespace-nowrap transition-colors ${active ? "bg-[rgba(0,102,255,.08)] text-primary font-semibold" : "text-labelNeutral font-medium hover:bg-fillAlt hover:text-label"}`}
            >
              {n.label}
              {n.badge ? <span className={`text-[11px] font-semibold px-[7px] py-[1px] rounded-pill ${active ? "bg-primary text-white" : "bg-[rgba(255,146,0,.14)] text-cautionaryFg"}`}>{n.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="hidden min-[901px]:flex border-t border-lineAlt pt-[16px] mt-[16px] text-[12px] text-labelAlt items-center gap-[10px]">
        <div className="w-[32px] h-[32px] rounded-full bg-primary text-white flex items-center justify-center font-semibold text-[12px] flex-none">{user.initial}</div>
        <div className="min-w-0">
          <div className="text-label font-semibold truncate text-[13px]">{user.name || "관리자"}{user.roleLabel && <span className="ml-[6px] text-[11px] font-semibold text-primary">{user.roleLabel}</span>}</div>
          <div className="truncate">{user.email}</div>
        </div>
      </div>
    </aside>
  );
}
