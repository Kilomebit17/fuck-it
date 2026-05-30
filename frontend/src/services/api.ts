import type { AuthResponse, Post, PostDetail, Comment } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data;
}

export const api = {
  // Auth
  login: (anonymousId: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ anonymousId, password }),
    }),

  checkId: (anonymousId: string) =>
    request<{ exists: boolean }>(`/auth/check-id/${anonymousId}`),

  getRandomId: () =>
    request<{ anonymousId: string }>("/auth/random-id"),

  // Feed
  getFeed: (limit?: number, tokenOverride?: string, search?: string) => {
    const headers: Record<string, string> = {};
    if (tokenOverride) {
      headers["Authorization"] = `Bearer ${tokenOverride}`;
    }
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (search) params.append("search", search);
    const qs = params.toString();
    return request<{ posts: Post[] }>(`/feed${qs ? `?${qs}` : ""}`, { headers });
  },

  // Posts
  createPost: (content: string) =>
    request<Post>("/posts", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getPost: (postId: string) =>
    request<{ post: PostDetail; comments: Comment[] }>(`/posts/${postId}`),

  // Comments
  createComment: (postId: string, content: string, parentCommentId?: string) =>
    request<Comment>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentCommentId }),
    }),

  // Reactions
  react: (targetType: string, targetId: string, type: string) =>
    request<{ likesCount: number; dislikesCount: number }>("/reactions", {
      method: "POST",
      body: JSON.stringify({ targetType, targetId, type }),
    }),

  // User
  getInterests: () =>
    request<{ interests: string[] }>("/user/interests"),
};
