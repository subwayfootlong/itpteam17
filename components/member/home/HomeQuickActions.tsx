import Link from "next/link";
import { CalendarDays, CreditCard, Gift, Megaphone } from "lucide-react";

// The Digital Card is the one thing the bottom nav does not cover, and the
// action members need most at an event door, so it gets the solid primary tile.
const actions = [
  {
    label: "Digital Card",
    href: "/member/profile",
    icon: CreditCard,
    tile: "bg-brand-primary-800 text-white shadow-sm",
  },
  {
    label: "Events",
    href: "/member/events",
    icon: CalendarDays,
    tile: "bg-brand-primary-100 text-brand-primary-800",
  },
  {
    label: "Benefits",
    href: "/member/benefit",
    icon: Gift,
    tile: "bg-brand-accent-soft text-amber-900",
  },
  {
    label: "Updates",
    href: "/member/community?tab=announcements",
    icon: Megaphone,
    tile: "bg-brand-secondary-soft text-brand-secondary-dark",
  },
];

export default function HomeQuickActions() {
  return (
    <nav aria-label="Quick actions" className="mt-4">
      <ul className="grid grid-cols-4 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <li key={action.label}>
              <Link
                href={action.href}
                className="group flex flex-col items-center gap-1.5 transition-transform duration-100 active:scale-95"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${action.tile}`}
                >
                  <Icon size={24} strokeWidth={2.1} aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-neutral-800">
                  {action.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
