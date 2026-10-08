import Link from "next/link";
import { CalendarDays, CreditCard } from "lucide-react";

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
    <section className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary-800 via-brand-primary-700 to-brand-primary-900 p-5 text-white shadow-md">
      {/* Ambient background glow and sheen accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-brand-primary-600/20 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/15"
      />

      <div className="relative z-10">
        {/* Top Meta Row */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
            <span>{tierLabel}</span>
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary-100">
            Pergas
          </span>
        </div>

        {/* Center / Status & Details */}
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-primary-200">
            Membership Status
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
            {tierLabel} Member
          </h2>

          <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-brand-primary-100">
            <CalendarDays size={15} className="text-brand-primary-200" />
            <span>Expires: {expiryLabel}</span>
            {expirySoon && (
              <span className="ml-1 rounded-md border border-brand-accent/40 bg-brand-accent/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-accent">
                Expiring soon
              </span>
            )}
          </div>
        </div>

        {/* Action Button: High contrast white card with deep Pergas green text */}
        <div className="mt-6">
          <Link
            href="/member/profile"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-bold text-brand-primary-800 shadow-md transition-transform duration-100 hover:bg-neutral-50 active:scale-[0.98]"
            aria-label={ctaLabel}
          >
            <CreditCard size={16} className="shrink-0 text-brand-primary-800" />
            <span className="font-bold text-brand-primary-800">
              {ctaLabel}
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
