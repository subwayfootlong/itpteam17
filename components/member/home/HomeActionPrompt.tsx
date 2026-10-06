import Link from "next/link";
import type { CurrentUser } from "@/lib/currentUser";

function isExpirySoon(expiryDate: string | null) {
  if (!expiryDate) return false;

  const expiry = new Date(`${expiryDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const difference = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return daysRemaining >= 0 && daysRemaining <= 30;
}

export default function HomeActionPrompt({ user }: { user: CurrentUser }) {
  const hasIncompleteProfile =
    !user.phone ||
    !user.firstName ||
    !user.lastName ||
    !user.organization;

  if (hasIncompleteProfile) {
    return (
      <section className="mt-8 overflow-hidden rounded-2xl border border-[#F5C985] bg-[#FFF0D9]/70 p-4.5 shadow-2xs">
        <h2 className="text-base font-bold text-neutral-900 leading-snug">
          Complete Your Profile
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          Add your contact and organisation details to unlock all member privileges.
        </p>

        <Link
          href="/member/profile/edit"
          className="mt-4 block w-full rounded-xl bg-[#7A4B00] px-4 py-2.5 text-center text-xs font-bold shadow-xs transition-all hover:bg-[#5E3900] active:scale-[0.98]"
          style={{ backgroundColor: "#7A4B00", color: "#ffffff" }}
        >
          <span className="font-bold text-white" style={{ color: "#ffffff" }}>
            Update Profile
          </span>
        </Link>
      </section>
    );
  }

  if (isExpirySoon(user.expiryDate)) {
    return (
      <section className="mt-8 overflow-hidden rounded-2xl border border-[#F5C985] bg-[#FFF0D9]/70 p-4.5 shadow-2xs">
        <h2 className="text-base font-bold text-neutral-900 leading-snug">
          Membership Renewal Reminder
        </h2>

        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
          Your membership will expire soon. Renew now to maintain continuous access.
        </p>

        <Link
          href="/member/profile"
          className="mt-4 block w-full rounded-xl border border-[#F5C985] bg-white px-4 py-2.5 text-center text-xs font-bold shadow-2xs transition-all hover:bg-[#FFF0D9] active:scale-[0.98]"
          style={{ backgroundColor: "#ffffff", color: "#7A4B00" }}
        >
          <span className="font-bold text-[#7A4B00]" style={{ color: "#7A4B00" }}>
            Review Membership
          </span>
        </Link>
      </section>
    );
  }

  return null;
}
