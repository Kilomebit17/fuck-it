"use client";

import { useTheme } from "@/hooks/useTheme";
import styles from "./ThemeToggle.module.scss";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className={styles.toggle} onClick={toggle} aria-label="Toggle theme">
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
