import type { PostDetail, Comment } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

interface PostIdsResponse {
  id: string;
  createdAt: string;
}

export async function fetchPostIds(): Promise<PostIdsResponse[]> {
  const res = await fetch(`${BASE}/posts`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchPost(postId: string): Promise<{
  post: PostDetail;
  comments: Comment[];
}> {
  const res = await fetch(`${BASE}/posts/${postId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error("Post not found");
  }
  return res.json();
}
