"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SESSION_IDLE_TIMEOUT_MS } from "@/lib/session";

const ACTIVITY_SYNC_INTERVAL_MS = 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "mousemove",
] as const;

export default function SessionTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncRef = useRef(0);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/?screen=login");
    router.refresh();
  }, [router]);

  const syncActivity = useCallback(async () => {
    const now = Date.now();
    if (now - lastSyncRef.current < ACTIVITY_SYNC_INTERVAL_MS) return;

    lastSyncRef.current = now;

    const res = await fetch("/api/auth/activity", { method: "POST" });
    if (res.status === 401) {
      await logout();
    }
  }, [logout]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void logout();
    }, SESSION_IDLE_TIMEOUT_MS);

    void syncActivity();
  }, [logout, syncActivity]);

  useEffect(() => {
    resetTimer();

    const onActivity = () => {
      resetTimer();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [resetTimer]);

  return null;
}
