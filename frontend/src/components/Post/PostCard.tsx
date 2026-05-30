"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Post } from "@/types";
import ReactionButton from "@/components/UI/ReactionButton/ReactionButton";
import SafeHtml from "@/components/Editor/SafeHtml";
import { stripHtml } from "@/lib/html";
import shared from "@/components/UI/Shared.module.scss";
import styles from "./PostCard.module.scss";

const CONTENT_MAX_HEIGHT = 280;

interface Props {
  post: Post;
  onReact: (postId: string, type: "like" | "dislike") => void;
  reactionLoading: string | null;
  formatTime: (s: string) => string;
}

export default function PostCard({ post, onReact, reactionLoading, formatTime }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollHeight > CONTENT_MAX_HEIGHT + 4);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [post.content]);

  const handleReadMore = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setExpanded(true);
    },
    []
  );

  const handleReact = useCallback(
    (type: "like" | "dislike") => (e: React.MouseEvent) => {
      e.preventDefault();
      onReact(post.id, type);
    },
    [onReact, post.id]
  );

  const plainContent = stripHtml(post.content);

  return (
    <Link href={`/post/${post.id}`} className={`${shared.card} ${styles.postCard}`}>
      <div className={styles.authorRow}>
        <span className={styles.author}>Anonymous {post.authorAnonymousId}</span>
        <span className={styles.time}>{formatTime(post.createdAt)}</span>
      </div>

      <div
        className={`${styles.content} ${!expanded && truncated ? styles.truncated : ""}`}
        ref={contentRef}
      >
        <SafeHtml html={post.content} className={styles.contentInner} />
      </div>

      {!expanded && truncated && (
        <div className={styles.fadeOverlay}>
          <button className={styles.readMore} onClick={handleReadMore}>
            Read more
          </button>
        </div>
      )}

      {post.hashtags.length > 0 && (
        <div className={styles.hashtags}>
          {post.hashtags.map((t) => (
            <span key={t} className={styles.hashtag}>
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <ReactionButton
          type="like"
          active={post.userReaction === "like"}
          count={post.likesCount}
          onClick={handleReact("like")}
          disabled={reactionLoading === post.id}
        />
        <ReactionButton
          type="dislike"
          active={post.userReaction === "dislike"}
          count={post.dislikesCount}
          onClick={handleReact("dislike")}
          disabled={reactionLoading === post.id}
        />
        <span className={styles.actionBtn}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.commentsCount}
        </span>
      </div>

      {post.topComment && (
        <div className={styles.topCommentSection}>
          <div className={styles.topCommentLine} />
          <div className={styles.topCommentBody}>
            <div className={styles.topComment}>
              <span className={styles.topCommentAuthor}>
                Anonymous {post.topComment.authorAnonymousId}
              </span>{" "}
              {post.topComment.content.length > 120
                ? post.topComment.content.slice(0, 120) + "..."
                : post.topComment.content}
            </div>
            <div className={styles.topCommentReactions}>
              <ReactionButton
                type="like"
                active={false}
                count={post.topComment.likesCount}
                onClick={handleReact("like")}
                disabled={reactionLoading === post.topComment.id}
              />
              <span className={styles.topCommentReply}>
                Reply
              </span>
            </div>
            {post.commentsCount > 1 && (
              <span className={styles.viewAll}>
                View all {post.commentsCount} comments &rarr;
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
