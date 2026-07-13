import Link from "next/link";
import { CalendarDays, CreditCard, Gift, Megaphone } from "lucide-react";

const actions = [
  {
    label: "Digital Card",
    href: "/member/profile",
    icon: CreditCard,
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
    label: "Announcements",
    href: "/member/community?tab=announcements",
    icon: Megaphone,
  },
];

export default function HomeQuickActions() {
  return (
    <section className="mt-8">
      <h2 className="member-text-xl font-semibold text-[#0F6E00]">
        Quick Actions
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm"
            >
              <Icon size={24} className="text-[#0F6E00]" />

              <span className="member-text-sm mt-2 font-semibold text-[#151C27]">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
