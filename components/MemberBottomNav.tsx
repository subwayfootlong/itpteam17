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
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gray-200 bg-white px-2 py-2"
      aria-label="Member navigation"
    >
      <div className="grid grid-cols-5 gap-1 text-center font-helvetica">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`min-w-0 rounded-xl px-1 py-1 transition-colors ${
                isActive
                  ? "bg-[#E8F4E6] font-semibold text-[#0F6E00]"
                  : "text-[#5F5E5E]"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={2.4}
                className="mx-auto mb-1"
                aria-hidden="true"
              />
              <span className="block whitespace-nowrap text-[15px] leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
