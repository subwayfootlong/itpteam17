"use client";

import NavLink from "@/components/ui/NavLink";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import MemberAvatar from "@/components/member/MemberAvatar";
import type { CurrentUser } from "@/lib/currentUser";

type MemberTopBarProps = {
  user: Pick<CurrentUser, "firstName" | "lastName" | "email" | "profileImageUrl">;
};

export default function MemberTopBar({ user }: MemberTopBarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    let receivedUnreadUpdate = false;

    function handleUnreadUpdate(event: Event) {
      receivedUnreadUpdate = true;
      const detail = (event as CustomEvent<{ unreadCount?: number }>).detail;
      setUnreadCount(Number(detail?.unreadCount) || 0);
    }

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/member/notifications", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!ignore && !receivedUnreadUpdate && response.ok) {
          setUnreadCount(Number(result.unreadCount) || 0);
        }
      } catch {
        // Keep the last known count if a navigation refresh fails.
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
  }, [pathname]);

  // These pages provide their own title and back navigation. Keep this
  // component mounted so its notification state survives those visits too.
  const hasPageHeader =
    pathname === "/member/payment" ||
    pathname === "/member/profile/edit" ||
    pathname === "/member/settings" ||
    pathname.startsWith("/member/settings/") ||
    /^\/member\/events\/[^/]+\/?$/.test(pathname);

  if (hasPageHeader) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-100 member-dark:border-member-border bg-white/80 member-dark:bg-member-surface/80 backdrop-blur-md px-5 py-3.5 transition-colors">
      <div className="flex items-center gap-3">
        <NavLink
          href="/member/profile"
          aria-label="Open profile"
          className="rounded-full ring-2 ring-transparent transition-all hover:ring-brand-primary-600/30 member-dark:hover:ring-brand-primary-700/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-800 member-dark:focus-visible:ring-brand-primary-700 focus-visible:ring-offset-2 active:scale-95"
        >
          <MemberAvatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            email={user?.email}
            profileImageUrl={user?.profileImageUrl}
            size={40}
          />
        </NavLink>

        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand-primary-800 member-dark:text-brand-primary-200 leading-tight">
            Portal
          </span>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 member-dark:text-neutral-100 leading-tight">
            Pergas
          </h1>
        </div>
      </div>

      <NavLink
        href="/member/notifications"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 member-dark:text-neutral-300 hover:text-neutral-900 member-dark:hover:text-neutral-100 hover:bg-neutral-100/80 member-dark:hover:bg-member-raised/80 transition-all active:scale-95"
      >
        <Bell size={20} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500" />
          </span>
        )}
      </NavLink>
    </header>
  );
}
