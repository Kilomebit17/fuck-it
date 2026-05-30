"use client";

import { useState, useMemo } from "react";
import CommentItem from "./CommentItem";

interface CommentData {
  id: string;
  parentCommentId: string | null;
  content: string;
  authorAnonymousId: string;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  userReaction?: string | null;
}

export function buildTree(comments: CommentData[]): Map<string | null, CommentData[]> {
  const map = new Map<string | null, CommentData[]>();
  for (const c of comments) {
    const key = c.parentCommentId;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return map;
}

const MAX_DEPTH = 6;

interface ListProps {
  comments: CommentData[];
  parentId: string | null;
  depth: number;
  tree: Map<string | null, CommentData[]>;
  onReact: (id: string, type: "like" | "dislike") => void;
  onReply: (parentId: string, content: string) => Promise<void>;
  reactionLoading: string | null;
  replyingTo: string | null;
  onReplyingToChange: (id: string | null) => void;
  formatTime: (s: string) => string;
  isAuthenticated: boolean;
}

export default function CommentList(props: ListProps) {
  const children = props.tree.get(props.parentId) || [];
  if (children.length === 0) return null;

  return (
    <>
      {children.map((c) => (
        <CommentNode key={c.id} {...props} comment={c} />
      ))}
    </>
  );
}

function CommentNode(props: ListProps & { comment: CommentData }) {
  const { comment, depth, tree, ...rest } = props;
  const [collapsed, setCollapsed] = useState(false);
  const children = tree.get(comment.id) || [];
  const replyCount = children.length;
  const tooDeep = depth >= MAX_DEPTH;

  return (
    <CommentItem
      comment={comment}
      depth={depth}
      replyCount={replyCount}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed(!collapsed)}
      {...rest}
    >
      {!collapsed && !tooDeep && children.map((child) => (
        <CommentNode key={child.id} {...props} comment={child} depth={depth + 1} />
      ))}
      {!collapsed && tooDeep && children.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "4px 0 4px 24px" }}>
          {replyCount} {replyCount === 1 ? "reply" : "replies"} below &middot; continue in expanded view
        </div>
      )}
    </CommentItem>
  );
}
