"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import type { Post } from "@/types";
import shared from "@/components/UI/Shared.module.scss";
import styles from "./RelatedPosts.module.scss";

interface Props {
  hashtags: string[];
  currentPostId: string;
}

export default function RelatedPosts({ hashtags, currentPostId }: Props) {
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hashtags.length === 0) return;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const searchQuery = hashtags.slice(0, 2).join(" ");
        const data = await api.getFeed(6, undefined, searchQuery);
        const filtered = (data.posts || [])
          .filter((p) => p.id !== currentPostId)
          .slice(0, 3);
        setRelated(filtered);
      } catch {} finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [hashtags, currentPostId]);

  if (related.length === 0 && !loading) return null;

  return (
    <section className={styles.relatedSection}>
      <h2 className={styles.relatedTitle}>Related posts</h2>
      {loading ? (
        <div className={shared.loading}>Loading...</div>
      ) : (
        <div className={styles.relatedGrid}>
          {related.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className={styles.relatedCard}>
              <span className={styles.relatedAuthor}>Anonymous {p.authorAnonymousId}</span>
              <p className={styles.relatedExcerpt}>
                {p.content.replace(/<[^>]*>/g, "").slice(0, 120)}
                {p.content.replace(/<[^>]*>/g, "").length > 120 ? "..." : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
