"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import AnonymousAvatar from "@/components/UI/AnonymousAvatar";
import shared from "@/components/UI/Shared.module.scss";
import styles from "./CreatePostForm.module.scss";

const RichEditor = dynamic(() => import("@/components/Editor/RichEditor"), {
  ssr: false,
  loading: () => <div className={styles.editorLoading}>Loading editor...</div>,
});

const MAX_LENGTH = 5000;

interface Props {
  onSubmit: (content: string) => Promise<void>;
  posting: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function CreatePostForm({ onSubmit, posting }: Props) {
  const [content, setContent] = useState("");
  const [user, setUser] = useState<{ anonymousId: string } | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const plain = stripHtml(content);
      if (!plain) return;
      await onSubmit(content);
      setContent("");
    },
    [content, onSubmit]
  );

  const handleChange = useCallback((html: string) => {
    setContent(html);
  }, []);

  const plainLength = stripHtml(content).length;

  return (
    <div className={styles.form}>
      <form onSubmit={handleSubmit}>
        <div className={styles.compose}>
          <div className={styles.avatar}>
            <AnonymousAvatar />
          </div>
          <div className={styles.body}>
            <RichEditor
              content={content}
              onChange={handleChange}
              placeholder="What's on your mind, anonymous?"
              maxLength={MAX_LENGTH}
            />
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.hint}>
            {plainLength}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            className={shared.btnPrimary}
            disabled={posting || !stripHtml(content)}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
