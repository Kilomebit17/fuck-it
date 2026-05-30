"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RedirectClient() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    router.replace(token ? "/feed" : "/login");
  }, [router]);
  return null;
}
