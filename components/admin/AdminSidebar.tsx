"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; badge?: number };

type Props = { items: AdminNavItem[]; user: { name: string; email: string; initial: string } };

/** design/RSC Admin.dc.html <aside> 재현. 900px 이하에서는 가로 스크롤 바로 바뀐다. */
export function AdminSidebar({ items, user }: Props) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside className="bg-ink text-cream flex flex-row items-center gap-[12px] overflow-x-auto p-[12px] min-[901px]:sticky min-[901px]:top-0 min-[901px]:h-screen min-[901px]:flex-col min-[901px]:items-stretch min-[901px]:overflow-visible min-[901px]:px-[20px] min-[901px]:py-[28px]">
      <Link href="/admin" className="flex items-center gap-[10px] px-[6px] min-[901px]:mb-[36px] flex-none">
        <Image src="/images/logo-emblem.png" alt="RSC" width={529} height={638} className="h-[28px] w-auto" />
        <div className="hidden min-[901px]:block">
          <div className="text-[12px] tracking-[.2em]">RSC ADMIN</div>
          <div className="text-[10.5px] text-[rgba(247,243,236,.5)] mt-[2px]">라움소셜클럽 관리자</div>
        </div>
      </Link>
      <nav className="flex flex-row gap-[4px] min-[901px]:flex-col min-[901px]:flex-1">
        {items.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center justify-between gap-[10px] px-[14px] py-[12px] rounded-[6px] text-[13.5px] font-semibold whitespace-nowrap hover:text-cream"
              style={{ background: active ? "rgba(247,243,236,.1)" : "transparent", color: active ? "#f7f3ec" : "rgba(247,243,236,.65)" }}
            >
              {n.label}
              {n.badge ? <span className="text-[10.5px] bg-gold text-ink px-[7px] py-[2px] rounded-pill">{n.badge}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="hidden min-[901px]:flex border-t border-[rgba(247,243,236,.12)] pt-[18px] text-[12.5px] text-[rgba(247,243,236,.6)] items-center gap-[10px]">
        <div className="w-[30px] h-[30px] rounded-full bg-gold text-ink flex items-center justify-center font-bold text-[12px] flex-none">{user.initial}</div>
        <div className="min-w-0">
          <div className="text-cream font-semibold truncate">{user.name || "관리자"}</div>
          <div className="truncate">{user.email}</div>
        </div>
      </div>
    </aside>
  );
}
