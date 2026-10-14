"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin top progress bar shown whenever the member taps a link or the app
 * starts a navigation. It confirms the tap instantly, creeps forward while the
 * next screen loads, and completes when the URL changes.
 *
 * Links are detected with a document-level click listener. Code that calls
 * router.push() directly can call startNavigationProgress() to show the bar.
 */

const START_EVENT = "pergas:navigation-start";
const MAX_DURATION_MS = 12000;

export function startNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(START_EVENT));
  }
}

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const activeRef = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failSafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (failSafeRef.current) clearTimeout(failSafeRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
  }, []);

  const finish = useCallback(() => {
    if (!activeRef.current) return;

    activeRef.current = false;
    clearTimers();
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
  }, [clearTimers]);

  const start = useCallback(() => {
    if (activeRef.current) return;

    activeRef.current = true;
    clearTimers();
    setVisible(true);
    setProgress(12);

    // Ease towards 90% so it always feels alive but never claims to be done
    tickRef.current = setInterval(() => {
      setProgress((current) => current + (90 - current) * 0.08);
    }, 180);
    failSafeRef.current = setTimeout(finish, MAX_DURATION_MS);
  }, [clearTimers, finish]);

  // Finish whenever the route actually changes
  useEffect(() => {
    finish();
  }, [routeKey, finish]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // Same page (or only a #hash change): nothing will load
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);

    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
      clearTimers();
    };
  }, [start, clearTimers]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      className="pointer-events-none fixed inset-x-0 top-0 z-[2000] h-[3px]"
    >
      <div
        className="h-full rounded-r-full bg-brand-primary-600 shadow-[0_0_8px_rgba(63,174,42,0.7)] transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
