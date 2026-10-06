"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Gift, MessageSquare, User } from "lucide-react";

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
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-200/80 bg-white/90 backdrop-blur-xl px-2 py-2 shadow-lg"
      aria-label="Member navigation"
    >
      <div className="grid grid-cols-5 gap-1 text-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex min-w-0 flex-col items-center justify-center rounded-xl py-1 px-1 transition-all active:scale-95 ${
                isActive
                  ? "bg-[#E8F4E6] text-[#0F6E00]"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform group-hover:scale-105 ${
                    isActive ? "text-[#0F6E00]" : "text-neutral-400 group-hover:text-neutral-600"
                  }`}
                  aria-hidden="true"
                />
              </div>

              <span
                className={`mt-1 block truncate text-[11px] leading-tight tracking-tight ${
                  isActive
                    ? "font-semibold text-[#0F6E00]"
                    : "font-medium text-neutral-400 group-hover:text-neutral-600"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
