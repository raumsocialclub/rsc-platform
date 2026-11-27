import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getPost } from "@/lib/posts/queries";

export const metadata: Metadata = { title: "소식 편집" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();
  return <PostForm key={post.updated_at} post={post} />;
}
