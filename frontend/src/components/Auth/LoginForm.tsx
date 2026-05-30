"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { useToast } from "@/components/UI/Toast";
import shared from "@/components/UI/Shared.module.scss";
import styles from "./LoginForm.module.scss";
import posthog from "posthog-js";

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [anonymousId, setAnonymousId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idExists, setIdExists] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) router.push("/feed");
  }, [router]);

  const checkId = useCallback(async (id: string) => {
    if (!/^\d{6}$/.test(id)) {
      setIdExists(null);
      return;
    }
    setChecking(true);
    try {
      const { exists } = await api.checkId(id);
      setIdExists(exists);
    } catch {
      setIdExists(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!anonymousId) {
      setIdExists(null);
      return;
    }
    const t = setTimeout(() => checkId(anonymousId), 500);
    return () => clearTimeout(t);
  }, [anonymousId, checkId]);

  const handleRandomId = async () => {
    try {
      const { anonymousId: id } = await api.getRandomId();
      setAnonymousId(id);
      toast(`ID: ${id}`, "info");
      posthog.capture("random_id_generated");
    } catch {
      toast("Failed to generate ID", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(anonymousId)) {
      setError("ID must be exactly 6 digits");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.login(anonymousId, password);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      posthog.identify(anonymousId);
      if (idExists) {
        posthog.capture("user_logged_in", { anonymous_id: anonymousId });
      } else {
        posthog.capture("user_signed_up", { anonymous_id: anonymousId });
      }
      toast(idExists ? "Welcome back!" : "Account created!", "success");
      router.push("/feed");
    } catch (err: any) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Fuck IT</h1>
        <p className={styles.subtitle}>
          Anonymous social. No profiles. No bullshit.
        </p>

        <form onSubmit={handleSubmit} autoComplete="off">
          {error && <div className={shared.formError}>{error}</div>}

          <div className={styles.formGroup}>
            <div className={styles.idRow}>
              <label className={styles.label}>Anonymous ID</label>
              <div className={styles.idInputWrap}>
                <input
                  className={`${shared.input} ${styles.idInput}`}
                  type="text"
                  value={anonymousId}
                  onChange={(e) =>
                    setAnonymousId(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="000001"
                  maxLength={6}
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="button"
                  className={shared.btnSecondary}
                  onClick={handleRandomId}
                  title="Random ID"
                >
                  🎲
                </button>
              </div>
            </div>
            {checking && <div className={styles.hint}>Checking...</div>}
          </div>

          <div className={styles.passwordGroup}>
            <label className={styles.label}>Password</label>
            <input
              className={shared.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className={`${shared.btnPrimary} ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
