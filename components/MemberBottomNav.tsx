"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  Gift,
  MessageSquare,
  User,
  type LucideIcon,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/** Tab icon that turns into a spinner the moment the tab is tapped. */
function TabIcon({ icon: Icon, isActive }: { icon: LucideIcon; isActive: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center">
      {pending ? (
        <LoadingSpinner label="" size="sm" />
      ) : (
        <Icon
          size={22}
          strokeWidth={isActive ? 2.5 : 2}
          fill={isActive ? "currentColor" : "none"}
          fillOpacity={isActive ? 0.15 : 0}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

const navItems = [
  {
    label: "Home",
    href: "/member",
    icon: Home,
  },
  {
    label: "Events",
    href: "/member/events",
    icon: CalendarDays,
  },
  {
    label: "Benefits",
    href: "/member/benefit",
    icon: Gift,
  },
  {
    label: "Community",
    href: "/member/community",
    icon: MessageSquare,
  },
  {
    label: "Profile",
    href: "/member/profile",
    icon: User,
  },
];

export default function MemberBottomNav() {
  const pathname = usePathname();

  function isActiveRoute(href: string) {
    if (href === "/member") {
      return pathname === "/member";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 member-dark:border-member-border bg-white/95 member-dark:bg-member-surface/95 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md"
      aria-label="Member navigation"
    >
      <div className="grid grid-cols-5 gap-1 text-center">
        {navItems.map((item) => {
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-1 transition-transform duration-100 active:scale-95 ${
                isActive
                  ? "font-semibold text-brand-primary-800 member-dark:text-brand-primary-200"
                  : "font-normal text-neutral-400 member-dark:text-neutral-400 hover:text-neutral-600 member-dark:hover:text-neutral-300"
              }`}
            >
              <TabIcon icon={item.icon} isActive={isActive} />

              <span className="mt-1 block truncate text-[11px] leading-tight tracking-tight">
                {item.label}
              </span>

              {/* Active indicator dot (space is reserved so tabs never shift) */}
              <span
                aria-hidden="true"
                className={`mx-auto mt-0.5 h-1 w-1 rounded-full ${
                  isActive ? "bg-brand-primary-800" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
