"use client";

import { useState, useCallback, useEffect } from "react";
import ThemeToggle from "@/components/UI/ThemeToggle";
import AnonymousAvatar from "@/components/UI/AnonymousAvatar";
import SearchInput from "@/components/Search/SearchInput";
import styles from "./Header.module.scss";

const MOBILE_BREAKPOINT = 768;

interface HeaderProps {
  anonymousId?: string | null;
  actions?: React.ReactNode;
  onSearch?: (query: string) => void;
}

export default function Header({ anonymousId, actions, onSearch }: HeaderProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);

  const closeSearch = useCallback(() => {
    setSearchExpanded(false);
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      onSearch?.(query);
    },
    [onSearch]
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setSearchExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`${styles.header} ${searchExpanded ? styles.searchExpanded : ""}`}
    >
      <h1
        className={`${styles.title} ${searchExpanded ? styles.titleHidden : ""}`}
      >
        Fuck IT
      </h1>

      {onSearch && (
        <div
          className={`${styles.desktopSearch} ${searchExpanded ? styles.desktopSearchHidden : ""}`}
        >
          <SearchInput onSearch={handleSearch} />
        </div>
      )}

      {onSearch && (
        <div
          className={`${styles.mobileSearch} ${searchExpanded ? styles.mobileSearchVisible : ""}`}
        >
          <SearchInput
            key={String(searchExpanded)}
            onSearch={handleSearch}
            autoFocus
            onClose={closeSearch}
          />
        </div>
      )}

      <div
        className={`${styles.actions} ${searchExpanded ? styles.actionsHidden : ""}`}
      >
        {onSearch && (
          <button
            className={styles.mobileSearchBtn}
            onClick={() => setSearchExpanded(true)}
            aria-label="Open search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        )}

        {anonymousId && (
          <span className={styles.userBadge}>
            <span className={styles.avatar}><AnonymousAvatar /></span>
            <span className={styles.userName}>Anonymous {anonymousId}</span>
          </span>
        )}

        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return <div className={styles.container}>{children}</div>;
}
