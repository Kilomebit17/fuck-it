"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useToast } from "@/components/UI/Toast";
import type { Post } from "@/types";
import Header, { Container } from "@/components/Layout/Header";
import CreatePostForm from "@/components/Post/CreatePostForm";
import PostCard from "@/components/Post/PostCard";
import shared from "@/components/UI/Shared.module.scss";
import posthog from "posthog-js";

export default function FeedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ anonymousId: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [rl, setRl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef(searchQuery);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!token || !u) { router.push("/login"); return; }
    setUser(JSON.parse(u));
  }, [router]);

  const fetchFeed = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const data = await api.getFeed(50, undefined, search || undefined);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    }
    catch (e: any) { toast(e.message || "Failed", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    searchRef.current = query;
    fetchFeed(query);
  }, [fetchFeed]);

  const handleReact = async (postId: string, type: "like" | "dislike") => {
    setRl(postId);
    try {
      const result = await api.react("post", postId, type);
      setPosts((p) => p.map((x) => x.id !== postId ? x : {
        ...x,
        likesCount: result.likesCount,
        dislikesCount: result.dislikesCount,
        userReaction: x.userReaction === type ? null : type,
      }));
      posthog.capture("post_reacted", { post_id: postId, reaction_type: type });
    } catch (e: any) { toast(e.message, "error"); }
    finally { setRl(null); }
  };

  const handleCreatePost = async (content: string) => {
    setPosting(true);
    try {
      await api.createPost(content);
      posthog.capture("post_created");
      toast("Post created!", "success");
      fetchFeed(searchRef.current);
    }
    catch (e: any) { toast(e.message, "error"); }
    finally { setPosting(false); }
  };

  const formatTime = (s: string) => {
    const diff = Date.now() - new Date(s).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (!user) return null;

  const isEmpty = !Array.isArray(posts) || posts.length === 0;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <>
      <Container>
        <Header
          anonymousId={user.anonymousId}
          onSearch={handleSearch}
          actions={
            <button className={shared.btnGhost} onClick={() => { localStorage.clear(); router.push("/login"); }}>Logout</button>
          }
        />
      </Container>
      <Container>
        <main style={{ padding: "24px 0" }}>
          <CreatePostForm onSubmit={handleCreatePost} posting={posting} />

          {loading ? (
            <div className={shared.loading}>{isSearching ? "Searching..." : "Loading feed..."}</div>
          ) : isEmpty && isSearching ? (
            <section className={shared.empty}>
              <div className={shared.emptyTitle}>No results</div>
              <p>No posts found for &quot;{searchQuery.trim()}&quot;</p>
            </section>
          ) : isEmpty ? (
            <section className={shared.empty}>
              <div className={shared.emptyTitle}>No posts yet</div>
              <p>Be the first to share something anonymous!</p>
            </section>
          ) : (
            <section aria-label="Posts feed">
              {posts.map((p) => <PostCard key={p.id} post={p} onReact={handleReact} reactionLoading={rl} formatTime={formatTime} />)}
            </section>
          )}
        </main>
      </Container>
    </>
  );
}
