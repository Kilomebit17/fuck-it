"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import shared from "@/components/UI/Shared.module.scss";
import styles from "./CommentInput.module.scss";

export interface CommentInputHandle {
  focus: () => void;
}

interface Props {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  collapseOnBlur?: boolean;
  showCompact?: boolean;
}

const CommentInput = forwardRef<CommentInputHandle, Props>(function CommentInput({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  autoFocus = false,
  collapseOnBlur = true,
  showCompact = true,
}, ref) {
  const [expanded, setExpanded] = useState(autoFocus);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setExpanded(true);
    },
  }));

  useEffect(() => {
    if (autoFocus) {
      setExpanded(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
      setExpanded(false);
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      if (onCancel) {
        onCancel();
      } else if (!content.trim()) {
        setExpanded(false);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!collapseOnBlur) return;
    if (formRef.current?.contains(e.relatedTarget as Node)) return;
    if (!content.trim()) {
      setExpanded(false);
    }
  };

  if (!expanded) {
    if (!showCompact) return null;
    return (
      <button
        className={`${shared.input} ${styles.compact}`}
        onClick={() => setExpanded(true)}
      >
        {placeholder}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <textarea
        ref={textareaRef}
        className={`${shared.textarea} ${styles.textarea}`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={1000}
        rows={3}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>
          {onCancel ? "Esc to cancel" : "Esc to close"} &middot; &#8984;+Enter to submit
        </span>
        <div className={styles.buttons}>
          {onCancel && (
            <button
              type="button"
              className={`${shared.btnGhost} ${styles.cancelBtn}`}
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={shared.btnPrimary}
            disabled={submitting || !content.trim()}
          >
            {submitting ? "Posting..." : "Comment"}
          </button>
        </div>
      </div>
    </form>
  );
});

export default CommentInput;
