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
    href: "#",
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
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gray-200 bg-[#FFFFFF] px-4 py-2">
      <div className="grid grid-cols-5 text-center text-xs">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={
                isActive
                  ? "rounded-xl bg-[#E8F4E6] px-2 py-1 text-[#0F6E00] font-semibold"
                  : "px-2 py-1 text-[#5F5E5E]"
              }
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={2.4} className="mx-auto mb-1" />
              <p>{item.label}</p>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}