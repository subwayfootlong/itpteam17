"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function MemberTopBar() {
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
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-[#FFFFFF] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full bg-gray-200">
          <Image
            src="/profile-placeholder.jpg"
            alt="Member profile"
            fill
            className="object-cover"
            sizes="44px"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-[#0F6E00]">Pergas</h1>
      </div>

      <Link
        href="/member/notifications"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        className="relative flex h-10 w-10 items-center justify-center text-[#5F5E5E]"
      >
        <Bell size={22} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#D92D20]" />
        )}
      </Link>
    </header>
  );
}
