"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import { stripHtml } from "@/lib/html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "strong", "b", "em", "i",
  "br", "span",
];

const ALLOWED_ATTR = ["style"];

export { stripHtml };

function sanitize(html: string): string {
  if (typeof window === "undefined") return stripHtml(html);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

interface Props {
  html: string;
  className?: string;
}

export default function SafeHtml({ html, className }: Props) {
  const sanitized = useMemo(() => sanitize(html), [html]);

  return (
    <div
      className={className}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
