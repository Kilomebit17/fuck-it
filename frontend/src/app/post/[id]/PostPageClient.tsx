"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/services/api";
import { useToast } from "@/components/UI/Toast";
import type { Comment, PostDetail } from "@/types";
import Header, { Container } from "@/components/Layout/Header";
import ReactionButton from "@/components/UI/ReactionButton/ReactionButton";
import CommentInput, { CommentInputHandle } from "@/components/Comment/CommentInput";
import SafeHtml from "@/components/Editor/SafeHtml";
import shared from "@/components/UI/Shared.module.scss";
import postCardStyles from "@/components/Post/PostCard.module.scss";
import detailStyles from "@/components/Post/PostDetail.module.scss";
import CommentList, { buildTree } from "@/components/Comment/CommentList";
import RelatedPosts from "./RelatedPosts";
import posthog from "posthog-js";

interface Props {
  initialPost: PostDetail;
  initialComments: Comment[];
}

export default function PostPageClient({ initialPost, initialComments }: Props) {
  const { id: postId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [post, setPost] = useState<PostDetail | null>(initialPost);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [rl, setRl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const commentInputRef = useRef<CommentInputHandle>(null);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    setAuthenticated(hasToken);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      posthog.capture("post_viewed", { post_id: postId });
      return;
    }

    const fetchUserData = async () => {
      try {
        const d = await api.getPost(postId);
        setPost(d.post);
        setComments(d.comments);
        posthog.capture("post_viewed", { post_id: postId });
      } catch (e: any) {
        setError(e.message || "Failed to load post");
      }
    };

    fetchUserData();
  }, [postId]);

  const handleReactPost = async (type: "like" | "dislike") => {
    if (!post) return;
    setRl(post.id);
    try {
      const r = await api.react("post", post.id, type);
      setPost((p) => p ? { ...p, likesCount: r.likesCount, dislikesCount: r.dislikesCount, userReaction: p.userReaction === type ? null : type } : p);
      posthog.capture("post_reacted", { post_id: post.id, reaction_type: type });
    } catch (e: any) { toast(e.message, "error"); }
    finally { setRl(null); }
  };

  const handleReactComment = async (id: string, type: "like" | "dislike") => {
    setRl(id);
    try {
      const r = await api.react("comment", id, type);
      setComments((c) => c.map((x) => x.id !== id ? x : { ...x, likesCount: r.likesCount, dislikesCount: r.dislikesCount, userReaction: x.userReaction === type ? null : type }));
      posthog.capture("comment_reacted", { post_id: postId, comment_id: id, reaction_type: type });
    } catch (e: any) { toast(e.message, "error"); }
    finally { setRl(null); }
  };

  const handleComment = useCallback(async (content: string) => {
    await api.createComment(postId, content);
    posthog.capture("comment_created", { post_id: postId });
    toast("Comment added!", "success");
    try {
      const d = await api.getPost(postId);
      setComments(d.comments);
      setPost((p) => p ? { ...p, commentsCount: d.post.commentsCount } : p);
    } catch {}
  }, [postId, toast]);

  const handleReply = useCallback(async (parentId: string, content: string) => {
    await api.createComment(postId, content, parentId);
    posthog.capture("comment_replied", { post_id: postId, parent_comment_id: parentId });
    setReplyingTo(null);
    toast("Reply added!", "success");
    try {
      const d = await api.getPost(postId);
      setComments(d.comments);
      setPost((p) => p ? { ...p, commentsCount: d.post.commentsCount } : p);
    } catch {}
  }, [postId, toast]);

  const formatTime = (s: string) => {
    const diff = Date.now() - new Date(s).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const tree = useMemo(() => buildTree(comments), [comments]);

  if (error) return (
    <Container>
      <Header />
      <div className={shared.empty}>
        <div className={shared.emptyTitle}>Error</div>
        <p style={{ color: "var(--text-secondary)", marginBottom: 16 }}>{error}</p>
        <button className={shared.btnPrimary} onClick={() => window.location.reload()}>Retry</button>
        <div style={{ marginTop: 12 }}><Link href="/feed">Back to feed</Link></div>
      </div>
    </Container>
  );

  if (!post) return <Container><Header /><div className={shared.empty}><div className={shared.emptyTitle}>Not found</div><Link href="/feed">Back</Link></div></Container>;

  return (
    <>
      <Container><Header /></Container>
      <Container>
        <div style={{ padding: "24px 0" }}>
          <div className={detailStyles.topBar}>
            <Link href="/feed" className={detailStyles.backLink}>&larr; Back to feed</Link>
            <span className={detailStyles.views}>{post.viewsCount} views</span>
          </div>
          <article className={`${shared.card} ${detailStyles.postDetail}`}>
            <div className={detailStyles.authorRow}>
              <span className={postCardStyles.author}>Anonymous {post.authorAnonymousId}</span>
              <span className={detailStyles.authorTime}>{formatTime(post.createdAt)}</span>
            </div>
            <SafeHtml html={post.content} className={`${postCardStyles.contentInner} ${detailStyles.detailContent}`} />
            {post.hashtags.length > 0 && (
              <div className={postCardStyles.hashtags}>
                {post.hashtags.map((t) => <span key={t} className={postCardStyles.hashtag}>#{t}</span>)}
              </div>
            )}
            <div className={detailStyles.detailActions}>
              <ReactionButton
                type="like"
                active={post.userReaction === "like"}
                count={post.likesCount}
                onClick={() => handleReactPost("like")}
                disabled={rl === post.id || !authenticated}
              />
              <ReactionButton
                type="dislike"
                active={post.userReaction === "dislike"}
                count={post.dislikesCount}
                onClick={() => handleReactPost("dislike")}
                disabled={rl === post.id || !authenticated}
              />
              <button className={detailStyles.commentBtn} onClick={() => commentInputRef.current?.focus()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{post.commentsCount}</span>
              </button>
            </div>
          </article>

          {authenticated && (
            <CommentInput ref={commentInputRef} onSubmit={handleComment} showCompact={false} />
          )}

          {comments.length === 0 ? (
            <div className={detailStyles.emptyComments}>No comments yet.</div>
          ) : (
            <CommentList comments={comments} parentId={null} depth={0} tree={tree}
              onReact={handleReactComment} onReply={handleReply} reactionLoading={rl}
              replyingTo={replyingTo} onReplyingToChange={setReplyingTo}
              formatTime={formatTime} isAuthenticated={authenticated} />
          )}

          <RelatedPosts hashtags={post.hashtags} currentPostId={post.id} />
        </div>
      </Container>
    </>
  );
}
