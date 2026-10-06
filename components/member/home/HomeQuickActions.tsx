import Link from "next/link";
import { CalendarDays, CreditCard, Gift, Megaphone } from "lucide-react";

const actions = [
  {
    label: "Digital Card",
    description: "Pass & details",
    href: "/member/profile",
    icon: CreditCard,
    tint: "bg-brand-primary-100 text-brand-primary-800",
  },
  {
    label: "Events",
    description: "Browse & RSVP",
    href: "/member/events",
    icon: CalendarDays,
    tint: "bg-brand-secondary-soft text-brand-secondary-dark",
  },
  {
    label: "Benefits",
    description: "Merchant perks",
    href: "/member/benefit",
    icon: Gift,
    tint: "bg-brand-accent-soft text-[#7A4B00]",
  },
  {
    label: "Announcements",
    description: "Latest news",
    href: "/member/community?tab=announcements",
    icon: Megaphone,
    tint: "bg-brand-primary-50 text-brand-primary-800",
  },
];

export default function HomeQuickActions() {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-neutral-900">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-neutral-100 bg-white p-3.5 shadow-xs transition-all hover:border-neutral-200 hover:shadow-sm active:scale-95"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.tint} transition-transform group-hover:scale-105`}
              >
                <Icon size={20} strokeWidth={2.2} />
              </div>

              <div className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-semibold leading-tight text-neutral-800">
                  {action.label}
                </span>
                <span className="mt-0.5 block truncate text-[11px] leading-tight text-neutral-400">
                  {action.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
