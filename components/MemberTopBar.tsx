"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import MemberAvatar from "@/components/member/MemberAvatar";
import type { CurrentUser } from "@/lib/currentUser";

type MemberTopBarProps = {
  user: CurrentUser | null;
};

export default function MemberTopBar({ user }: MemberTopBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    function handleUnreadUpdate(event: Event) {
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;
      setUnreadCount(Number(detail?.unreadCount) || 0);
    }

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/member/notifications", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!ignore && response.ok) {
          setUnreadCount(Number(result.unreadCount) || 0);
        }
      } catch {
        if (!ignore) setUnreadCount(0);
      }
    }

    window.addEventListener("notifications:unread-count", handleUnreadUpdate);
    loadUnreadCount();

    return () => {
      ignore = true;
      window.removeEventListener(
        "notifications:unread-count",
        handleUnreadUpdate,
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-100 bg-white/80 backdrop-blur-md px-5 py-3.5 transition-colors">
      <div className="flex items-center gap-3">
        <Link
          href="/member/profile"
          aria-label="Open profile"
          className="rounded-full ring-2 ring-transparent transition-all hover:ring-[#3FAE2A]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F6E00] focus-visible:ring-offset-2 active:scale-95"
        >
          <MemberAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            email={user?.email}
            profileImageUrl={user?.profileImageUrl}
            size={40}
          />
        </Link>

        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#0F6E00] leading-tight">
            Portal
          </span>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 leading-tight">
            Pergas
          </h1>
        </div>
      </div>

      <Link
        href="/member/notifications"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80 transition-all active:scale-95"
      >
        <Bell size={20} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
          </span>
        )}
      </Link>
    </header>
  );
}
