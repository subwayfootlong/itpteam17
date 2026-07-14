import Link from "next/link";
import { CalendarDays } from "lucide-react";

type HomeMembershipCardProps = {
  tierLabel: string;
  expiryLabel: string;
  expiryDate: string | null;
};

function isExpirySoon(expiryDate: string | null) {
  if (!expiryDate) return false;

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const difference = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return daysRemaining >= 0 && daysRemaining <= 30;
}

export default function HomeMembershipCard({
  tierLabel,
  expiryLabel,
  expiryDate,
}: HomeMembershipCardProps) {
  const expirySoon = isExpirySoon(expiryDate);
  const ctaLabel = expirySoon ? "Review Membership" : "View Digital Card";

  return (
    <section className="mt-8 overflow-hidden rounded-xl bg-[#0F7A00] p-6 text-white">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10"
        />

        <p className="member-text-sm relative z-10 text-sm uppercase tracking-[0.18em] text-white/90">
          Your Status
        </p>

        <h2 className="member-text-xl relative z-10 mt-3 text-xl font-medium">
          {tierLabel} Member
        </h2>

        <div className="member-text-base relative z-10 mt-5 flex items-center gap-2 text-white/95">
          <CalendarDays size={18} />
          <p>Expires: {expiryLabel}</p>
        </div>

        <Link
          href="/member/profile"
          className="member-text-base relative z-10 mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-white px-4 py-4 text-center font-bold text-[#0F6E00]"
          aria-label={ctaLabel}
        >
          <span className="text-[#0F6E00]">{ctaLabel}</span>
        </Link>
      </div>
    </section>
  );
}
