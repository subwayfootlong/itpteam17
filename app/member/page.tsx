import Link from "next/link";
import MemberPageShell from "@/components/member/MemberPageShell";
import { getCurrentUser } from "@/lib/currentUser";
import { formatMemberDate } from "@/lib/dates";
import { formatTierLabel } from "@/lib/membershipTiers";
import { CalendarDays, Coffee } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const displayFirstName = user?.firstName || user?.fullName || "Member";
  const displayLastName = user?.lastName ?? "";
  const tierLabel = formatTierLabel(user?.membershipTier);
  const expiryLabel = formatMemberDate(user?.expiryDate ?? null);

  return (
    <MemberPageShell>
      <div className="px-5 py-6">
        <section>
          <h1 className="member-text-2xl text-3xl font-bold leading-tight text-[#151C27]">
            Assalamualaikum,
            <br />
            <span className="text-[#2EAE23]">
              {displayFirstName}
              {displayLastName ? ` ${displayLastName}` : ""}
            </span>
          </h1>

          <p className="member-text-lg mt-3 text-lg leading-relaxed text-[#3F473F]">
            Welcome back to your community dashboard.
          </p>
        </section>

        <section className="mt-10">
          <Link
            href="/member/events"
            className="relative block h-72 overflow-hidden rounded-xl bg-gray-200 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home-featured-event.jpg"
              alt="Featured event"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <span className="rounded-full bg-[#0F6E00] px-4 py-2 text-sm font-semibold">
                Featured Event
              </span>

              <h2 className="member-text-lg mt-4 text-lg font-semibold">
                Annual Islamic Scholars Dialogue 2024
              </h2>

              <p className="member-text-base mt-2 text-base leading-relaxed text-white/90">
                Join the conversation on modern challenges and spiritual
                growth with leading scholars.
              </p>
            </div>
          </Link>
        </section>

        <section className="mt-10 overflow-hidden rounded-xl bg-[#0F7A00] p-6 text-white">
          <div className="relative">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />

            <p className="member-text-sm text-sm uppercase tracking-[0.18em] text-white/90">
              Your Status
            </p>

            <h2 className="member-text-xl mt-3 text-xl font-medium">{tierLabel} Member</h2>

            <div className="member-text-base mt-5 flex items-center gap-2 text-white/95">
              <CalendarDays size={18} />
              <p>Expires: {expiryLabel}</p>
            </div>

            <Link
              href="/member/profile"
              className="member-text-base mt-8 block min-h-11 rounded-xl bg-white px-4 py-4 text-center font-bold text-[#0F6E00]"
            >
              View Digital Card
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#FFE1B8] px-4 py-2 text-sm font-medium text-[#7A4B00]">
              Religious
            </span>

            <CalendarDays size={24} className="text-[#0F6E00]" />
          </div>

          <h2 className="member-text-lg mt-6 text-lg font-medium text-[#151C27]">
            The Path of Wisdom: Weekly Halqa
          </h2>

          <p className="member-text-base mt-3 text-base text-[#5F5E5E]">
            Every Friday • 7:30 PM
          </p>

          <Link
            href="/member/events"
            className="member-text-base mt-7 block min-h-11 rounded-xl bg-[#0F6E00] px-4 py-4 text-center font-bold text-white"
          >
            Register Now
          </Link>
        </section>

        <section className="mt-10 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 text-[#9B6500]">
              <Coffee size={28} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="member-text-base min-w-0 break-words font-bold text-[#151C27]">Brew & Bean</h2>
              <p className="member-text-sm text-sm text-[#5F5E5E]">Merchant Partner</p>
            </div>
          </div>

          <div className="member-text-base mt-5 rounded-lg border border-[#F5C985] bg-[#FFF0D9] px-4 py-3 text-center font-bold text-[#7A4B00]">
            15% OFF TOTAL BILL
          </div>

          <Link
            href="/member/benefit"
            className="member-text-base mt-6 block min-h-11 rounded-xl border border-gray-300 px-4 py-4 text-center font-bold text-[#151C27]"
          >
            Explore Benefits
          </Link>
        </section>

        <section className="mt-10 overflow-hidden rounded-xl bg-[#151C27] p-0 text-white">
          <div className="relative min-h-60 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home-upgrade-bg.jpg"
              alt="Upgrade background"
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />

            <div className="absolute inset-0 bg-black/40" />

            <div className="relative rounded-xl border border-white/30 bg-white/15 p-6 backdrop-blur-sm">
              <h2 className="member-text-lg text-lg font-medium">Upgrade your Experience</h2>

              <p className="member-text-base mt-4 leading-relaxed text-white/90">
                Unlock exclusive access to scholar-led retreats, priority
                event registration, and premium merchant perks.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Link
                  href="/member/profile"
                  className="member-text-base rounded-lg bg-[#B47A00] px-4 py-3 text-center font-bold text-white"
                >
                  Upgrade Now
                </Link>

                <Link
                  href="/member/benefit"
                  className="member-text-base rounded-lg border border-white/50 bg-white/10 px-4 py-3 text-center font-bold text-white"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MemberPageShell>
  );
}
