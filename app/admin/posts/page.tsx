import type { Metadata } from "next";
import { PostsTable } from "@/components/admin/PostsTable";
import { listAllPosts } from "@/lib/posts/queries";

export const metadata: Metadata = { title: "소식 게시판" };

export default async function AdminPostsPage() {
  return <PostsTable posts={await listAllPosts()} />;
}
