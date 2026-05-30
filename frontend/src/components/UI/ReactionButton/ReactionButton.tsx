"use client";

import styles from "./ReactionButton.module.scss";

interface Props {
  type: "like" | "dislike";
  active: boolean;
  count: number;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ThumbsDownIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(0, 24) scale(1, -1)">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      </g>
    </svg>
  );
}

export default function ReactionButton({ type, active, count, onClick, disabled }: Props) {
  const activeClass = type === "like" ? styles.likeActive : styles.dislikeActive;

  return (
    <button
      className={`${styles.btn} ${active ? activeClass : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {type === "like" ? (
        <HeartIcon filled={active} />
      ) : (
        <ThumbsDownIcon filled={active} />
      )}
      <span>{count}</span>
    </button>
  );
}
