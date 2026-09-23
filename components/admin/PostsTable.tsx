import Image from "next/image";
import Link from "next/link";
import { CARD, TH, TD as TD0, Badge, EmptyRow, PageTitle } from "./ui";
import { PostRowActions } from "./PostRowActions";
import { badgeStyle } from "@/lib/admin/format";
import { fmtDate, type Post } from "@/lib/posts/types";

const TD = `${TD0} px-[10px]`;
const TH2 = `${TH} px-[10px]`;

/** 소식 게시판 목록 (M11) */
export function PostsTable({ posts }: { posts: Post[] }) {
  return (
    <>
      <PageTitle overline="NEWS" title="소식 게시판">
        <div className="flex gap-[8px] items-center">
          <Link href="/news" target="_blank" className="text-[12.5px] text-[rgba(33,30,25,.55)] underline">공개 화면 보기 ↗</Link>
          <Link href="/admin/posts/new" className="border-0 bg-brown text-cream px-[20px] py-[11px] text-[13px] font-semibold hover:bg-brownHover hover:text-cream">+ 새 글 쓰기</Link>
        </div>
      </PageTitle>
      <div className={CARD}>
        <div className="overflow-x-auto">
          <table className="border-collapse w-full">
            <thead><tr>{["", "제목", "분류", "발행일", "수정", "상태", ""].map((h, i) => <th key={i} className={TH2}>{h}</th>)}</tr></thead>
            <tbody>
              {posts.length === 0 && <EmptyRow colSpan={7}>아직 글이 없습니다. 오른쪽 위 &quot;+ 새 글 쓰기&quot; 로 첫 소식을 올려 보세요.</EmptyRow>}
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-[#faf7f1]">
                  <td className={TD}>
                    <div className="relative w-[64px] h-[42px] bg-[#e7e0d3] overflow-hidden">
                      {p.cover_image && <Image src={p.cover_image} alt="" fill sizes="64px" className="object-cover" unoptimized={p.cover_image.startsWith("http")} />}
                    </div>
                  </td>
                  <td className={`${TD} whitespace-normal min-w-[240px]`}>
                    <Link href={`/admin/posts/${p.id}`} className="font-semibold hover:text-brownHover">{p.title}</Link>
                    <div className="text-[11.5px] text-[rgba(33,30,25,.45)] mt-[2px]">/news/{p.slug}</div>
                  </td>
                  <td className={TD}>{p.category}</td>
                  <td className={TD}>{fmtDate(p.published_at) || "—"}</td>
                  <td className={`${TD} text-[rgba(33,30,25,.55)]`}>{fmtDate(p.updated_at)}</td>
                  <td className={TD}>
                    <PostRowActions id={p.id} published={p.published} badge={<Badge style={badgeStyle(p.published ? "ok" : "mute")}>{p.published ? "발행" : "임시 저장"}</Badge>} />
                  </td>
                  <td className={TD}>
                    {p.published && <Link href={`/news/${encodeURIComponent(p.slug)}`} target="_blank" className="text-[12px] text-[rgba(33,30,25,.55)] underline">보기 ↗</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
