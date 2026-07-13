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
      <section className="mt-8 rounded-xl border border-[#F5D9A8] bg-[#FFF8EE] p-5">
        <h2 className="member-text-lg font-semibold text-[#151C27]">
          Complete Your Profile
        </h2>

        <p className="member-text-sm mt-2 text-[#5F5E5E]">
          Add your contact and organisation details.
        </p>

        <Link
          href="/member/profile/edit"
          className="member-text-base mt-5 block rounded-xl bg-[#0F6E00] px-4 py-3 text-center font-semibold text-white"
        >
          Update Profile
        </Link>
      </section>
    );
  }

  if (isExpirySoon(user.expiryDate)) {
    return (
      <section className="mt-8 rounded-xl border border-[#F5D9A8] bg-[#FFF8EE] p-5">
        <h2 className="member-text-lg font-semibold text-[#151C27]">
          Membership Renewal Reminder
        </h2>

        <p className="member-text-sm mt-2 text-[#5F5E5E]">
          Your membership will expire soon.
        </p>

        <Link
          href="/member/profile"
          className="member-text-base mt-5 block rounded-xl border border-[#D9C08A] px-4 py-3 text-center font-semibold text-[#151C27]"
        >
          Review Membership
        </Link>
      </section>
    );
  }

  return null;
}
