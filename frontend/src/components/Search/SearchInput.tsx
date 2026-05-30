"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./SearchInput.module.scss";

const DEBOUNCE_MS = 500;

interface Props {
  onSearch: (query: string) => void;
  autoFocus?: boolean;
  onClose?: () => void;
}

export default function SearchInput({ onSearch, autoFocus, onClose }: Props) {
  const [value, setValue] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSearchedRef = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const performSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed === lastSearchedRef.current) return;
      lastSearchedRef.current = trimmed;
      onSearch(trimmed);
    },
    [onSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performSearch(next);
    }, DEBOUNCE_MS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      performSearch(value);
    }
    if (e.key === "Escape" && onClose) {
      onClose();
    }
  };

  const handleSearchClick = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    performSearch(value);
  };

  const handleClear = () => {
    setValue("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    performSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className={`${styles.searchWrap} ${autoFocus ? styles.searchWrapExpanded : ""}`}>
      {autoFocus && onClose && (
        <button
          className={styles.backBtn}
          onClick={onClose}
          aria-label="Close search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder="Search posts..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {value.length > 0 && (
        <button
          className={styles.clearBtn}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      <button
        className={styles.btn}
        onClick={handleSearchClick}
        aria-label="Search"
      >
        <svg
          width="16"
          height="16"
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
    </div>
  );
}
