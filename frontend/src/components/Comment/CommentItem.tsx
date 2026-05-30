"use client";

import ReactionButton from "@/components/UI/ReactionButton/ReactionButton";
import CommentInput from "@/components/Comment/CommentInput";
import styles from "./CommentItem.module.scss";

interface CommentData {
  id: string;
  content: string;
  authorAnonymousId: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  userReaction?: string | null;
}

interface Props {
  comment: CommentData;
  depth: number;
  onReact: (id: string, type: "like" | "dislike") => void;
  onReply: (parentId: string, content: string) => Promise<void>;
  reactionLoading: string | null;
  replyingTo: string | null;
  onReplyingToChange: (id: string | null) => void;
  formatTime: (s: string) => string;
  replyCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isAuthenticated: boolean;
  children?: React.ReactNode;
}

export default function CommentItem({
  comment, depth, onReact, onReply, reactionLoading, replyingTo,
  onReplyingToChange, formatTime,
  replyCount, collapsed, onToggleCollapse, isAuthenticated, children,
}: Props) {
  return (
    <div className={`${styles.comment} ${depth > 0 ? styles.commentNested : ""}`}>
      <div className={styles.header}>
        <span className={styles.author}>Anonymous {comment.authorAnonymousId}</span>
        <span className={styles.time}>{formatTime(comment.createdAt)}</span>
      </div>
      <div className={styles.content}>{comment.content}</div>
      <div className={styles.actions}>
        {isAuthenticated && <>
          <ReactionButton
            type="like"
            active={comment.userReaction === "like"}
            count={comment.likesCount}
            onClick={() => onReact(comment.id, "like")}
            disabled={reactionLoading === comment.id}
          />
          <ReactionButton
            type="dislike"
            active={comment.userReaction === "dislike"}
            count={comment.dislikesCount}
            onClick={() => onReact(comment.id, "dislike")}
            disabled={reactionLoading === comment.id}
          />
          <button className={styles.replyBtn}
            onClick={() => onReplyingToChange(replyingTo === comment.id ? null : comment.id)}>
            Reply
          </button>
        </>}
        {!isAuthenticated && comment.likesCount > 0 && (
          <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {comment.likesCount}
          </span>
        )}
        {replyCount > 0 && (
          <button className={styles.collapseBtn} onClick={onToggleCollapse}>
            {collapsed ? `▶ ${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "▼"}
          </button>
        )}
      </div>
      {isAuthenticated && replyingTo === comment.id && (
        <CommentInput
          onSubmit={(content) => onReply(comment.id, content)}
          onCancel={() => onReplyingToChange(null)}
          placeholder="Write a reply..."
          autoFocus
          collapseOnBlur={false}
        />
      )}
      {children}
    </div>
  );
}
