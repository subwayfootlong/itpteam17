"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import type { MemberProfile } from "@/app/member/profile/page";
import { formatTierLabel } from "@/lib/membershipTiers";
import { formatSalutationLabel } from "@/lib/memberProfileOptions";
import { formatMemberName } from "@/lib/memberName";
import { formatMemberDate } from "@/lib/dates";
import { LOGOUT_LOGIN_HINT_KEY } from "@/lib/session";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarCheck,
  Check,
  ChevronRight,
  Edit3,
  Handshake,
  Library,
  LogOut,
  MapPin,
  Percent,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Vote,
} from "lucide-react";

type Benefit = {
  title: string;
  subtitle: string;
  icon: React.ElementType;
};

type EventRegistration = {
  id: string;
  registered_at: string;
  status: string | null;
  rejection_message: string | null;
  events:
    | {
        id: string;
        title: string | null;
        venue: string | null;
        event_date: string | null;
      }
    | Array<{
        id: string;
        title: string | null;
        venue: string | null;
        event_date: string | null;
      }>
    | null;
};

const benefitsByTier: Record<string, Benefit[]> = {
  basic: [
    {
      title: "Member Portal",
      subtitle: "Access to member resources & articles",
      icon: Library,
    },
    {
      title: "Event Discovery",
      subtitle: "Browse and RSVP for Pergas community events",
      icon: CalendarCheck,
    },
    {
      title: "Announcements",
      subtitle: "Direct access to official Pergas communications",
      icon: BookOpen,
    },
  ],

  student: [
    {
      title: "Digital Library",
      subtitle: "Curated reference and study material",
      icon: Library,
    },
    {
      title: "Course Discounts",
      subtitle: "10% off selected program and workshop fees",
      icon: Percent,
    },
    {
      title: "Book Purchases",
      subtitle: "15% off publications and Islamic literature",
      icon: BookOpen,
    },
    {
      title: "Friends of Pergas",
      subtitle: "Exclusive community merchant partner perks",
      icon: Handshake,
    },
  ],

  associate: [
    {
      title: "Digital Library",
      subtitle: "Full reference repository access",
      icon: Library,
    },
    {
      title: "Program Discounts",
      subtitle: "10% off Islamic education programs",
      icon: Percent,
    },
    {
      title: "Book Purchases",
      subtitle: "15% discount on all bookstore publications",
      icon: BookOpen,
    },
    {
      title: "Friends of Pergas",
      subtitle: "Partner perks across dining & lifestyle",
      icon: Handshake,
    },
    {
      title: "Priority Entry",
      subtitle: "Early access reservations for premier events",
      icon: CalendarCheck,
    },
    {
      title: "Exclusive Events",
      subtitle: "Invitations to closed-door roundtable dialogues",
      icon: Award,
    },
    {
      title: "Ar-Risalah Delivery",
      subtitle: "Quarterly printed magazine delivered to your home",
      icon: Truck,
    },
  ],

  ordinary: [
    {
      title: "Digital Library",
      subtitle: "Complete digital scholarly archive",
      icon: Library,
    },
    {
      title: "Course Discounts",
      subtitle: "10% privilege on selected educational programs",
      icon: Percent,
    },
    {
      title: "Book Purchases",
      subtitle: "15% discount across the bookstore catalog",
      icon: BookOpen,
    },
    {
      title: "Friends of Pergas",
      subtitle: "Merchant lifestyle and retail savings",
      icon: Handshake,
    },
    {
      title: "Priority Entry",
      subtitle: "Early RSVP window for major symposiums",
      icon: CalendarCheck,
    },
    {
      title: "Exclusive Programs",
      subtitle: "Invitations to members-only scholarly sessions",
      icon: Award,
    },
    {
      title: "Ar-Risalah Magazine",
      subtitle: "Complimentary quarterly periodical delivery",
      icon: Truck,
    },
    {
      title: "Board Eligibility",
      subtitle: "Eligible to stand for council nomination",
      icon: Users,
    },
    {
      title: "Voting Rights",
      subtitle: "Full franchise at the Annual General Meeting",
      icon: Vote,
    },
  ],
};

export default function ProfileView({
  member,
  registrations = [],
}: {
  member: MemberProfile;
  registrations?: EventRegistration[];
}) {
  const router = useRouter();
  const tier = member.membership_tier || "basic";
  const benefits = benefitsByTier[tier] || benefitsByTier.basic;

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) {
      return;
    }

    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.sessionStorage.setItem(LOGOUT_LOGIN_HINT_KEY, "1");
    router.replace("/");
  }

  const qrValue = JSON.stringify({
    memberId: member.member_id,
    name: formatMemberName(member, "Member Name"),
    status: member.membership_status,
    tier: member.membership_tier,
  });

  return (
    <div className="space-y-6 px-4 py-5 font-helvetica">
      {/* 1. Digital Membership Pass (Benchmark: Setel & Monzo) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#173F14] via-[#245F1B] to-[#0F6E00] p-5 text-white shadow-xl">
        {/* Subtle sheen and ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#3FAE2A]/20 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/20"
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Top Tier Badge & Brand Tag */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                {formatTierLabel(member.membership_tier)}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#E8F4E6]/80">
                Pergas
              </span>
            </div>

            {/* Member Name */}
            <h2 className="mt-3.5 text-lg font-bold tracking-tight text-white line-clamp-1">
              {formatMemberName(member, "Member Name")}
            </h2>
            {member.arabic_name && (
              <p className="mt-0.5 text-xs text-white/80 line-clamp-1" dir="rtl">
                {member.arabic_name}
              </p>
            )}

            {/* Member ID */}
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#BCE6B2]">
                Member ID
              </p>
              <p className="font-mono text-sm font-bold tracking-widest text-[#E8F4E6]">
                {member.member_id || "PGS-0000-0000"}
              </p>
            </div>

            {/* Validity */}
            <p className="mt-3 text-[11px] font-medium text-white/80">
              Valid thru:{" "}
              <span className="font-semibold text-white">
                {formatMemberDate(member.expiry_date)}
              </span>
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex shrink-0 flex-col items-center">
            <div className="rounded-2xl bg-white p-2.5 shadow-md">
              <QRCodeCanvas value={qrValue} size={78} />
            </div>
            <span className="mt-1.5 text-[10px] font-medium tracking-wide text-[#E8F4E6]/80">
              Digital Pass
            </span>
          </div>
        </div>
      </section>

      {tier !== "ordinary" && (
        <Link
          href="/member/tier-upgrade"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#0F6E00]/30 bg-[#E8F4E6]/60 px-4 py-3 text-sm font-semibold text-[#0F6E00] shadow-2xs transition-all hover:bg-[#E8F4E6] active:scale-[0.99]"
        >
          <Award size={18} />
          <span>Request Tier Upgrade</span>
        </Link>
      )}

      {/* 2. Account Details Overhaul (Benchmark: Marriott Bonvoy & Zomato) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-900">
              Account Details
            </h2>
            <p className="text-xs text-neutral-500">
              Personal & contact information
            </p>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
            Verified
          </span>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-xs">
          {/* Structured 2-column detail grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Salutation
              </span>
              <span className="mt-0.5 block text-sm font-medium text-neutral-800">
                {formatSalutationLabel(member.salutation) || "—"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Arabic Name
              </span>
              <span
                className="mt-0.5 block truncate text-sm font-medium text-neutral-800"
                dir={member.arabic_name ? "rtl" : "ltr"}
              >
                {member.arabic_name || "—"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                First Name
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-neutral-800">
                {member.first_name || "—"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Last Name
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-neutral-800">
                {member.last_name || "—"}
              </span>
            </div>

            <div className="col-span-2 border-t border-neutral-100 pt-3">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Email Address
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-neutral-800">
                {member.email}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Phone Number
              </span>
              <span className="mt-0.5 block text-sm font-medium text-neutral-800">
                {member.phone || "—"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Organization
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-neutral-800">
                {member.organization || "—"}
              </span>
            </div>

            <div className="col-span-2">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Designation
              </span>
              <span className="mt-0.5 block truncate text-sm font-medium text-neutral-800">
                {member.designation || "—"}
              </span>
            </div>
          </div>

          {/* Validity & Dates Row with soft badge pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/80 bg-stone-100/80 px-3 py-1 text-xs font-medium text-stone-700">
              <span className="text-stone-500">Member Since:</span>
              <span className="font-bold text-stone-900">
                {formatMemberDate(member.member_since)}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#CDE5CA] bg-[#E8F4E6] px-3 py-1 text-xs font-medium text-[#0F6E00]">
              <span>Renewal Date:</span>
              <span className="font-bold">
                {formatMemberDate(member.expiry_date)}
              </span>
            </div>
          </div>

          {/* Edit Profile CTA Button */}
          <Link
            href="/member/profile/edit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F6E00]/30 bg-[#E8F4E6]/50 px-4 py-2.5 text-center text-sm font-semibold text-[#0F6E00] shadow-2xs transition-all hover:bg-[#E8F4E6] active:scale-[0.99]"
          >
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </Link>
        </div>
      </section>

      {/* 3. Active Privileges -> Horizontal Sliding Carousel (Benchmark: Drop app) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-900">
              Active Privileges
            </h2>
            <p className="text-xs text-neutral-500">
              Tier benefits & privileges
            </p>
          </div>
          <span className="rounded-full bg-[#E8F4E6] px-2.5 py-0.5 text-xs font-bold text-[#0F6E00]">
            {benefits.length} perks
          </span>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isTeal = index % 3 === 1;
            const isGold = index % 3 === 2;

            const iconClass = isTeal
              ? "bg-[#E8F7F5] text-[#1E988A]"
              : isGold
                ? "bg-[#FFF0D9] text-[#7A4B00]"
                : "bg-[#E8F4E6] text-[#0F6E00]";

            return (
              <div
                key={benefit.title}
                className="flex w-[240px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-xs transition-all hover:border-neutral-200 hover:shadow-sm"
              >
                <div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass} shadow-2xs`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>

                  <h3 className="mt-3 text-sm font-bold leading-snug text-neutral-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {benefit.subtitle}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E00]">
                    <Check size={12} strokeWidth={3} />
                    Active Benefit
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                    Included
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Participation History (Empty state & timeline polish) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-neutral-900">
              Participation History
            </h2>
            <p className="text-xs text-neutral-500">
              Your registered events & activities
            </p>
          </div>
          <Link
            href="/member/events"
            className="text-xs font-semibold text-[#0F6E00] transition-colors hover:text-[#173F14]"
          >
            Browse events
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-stone-200/80 bg-white text-[#0F6E00] shadow-2xs">
              <CalendarCheck size={22} />
            </div>
            <h3 className="text-sm font-bold font-sans text-neutral-900">
              No upcoming registrations
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-neutral-600">
              Explore upcoming workshops, scholarly lectures, and community events!
            </p>
            <Link
              href="/member/events"
              className="mt-3.5 inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#0F6E00] shadow-2xs transition-all hover:bg-stone-50 active:scale-95"
            >
              <span>Explore upcoming events</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-xs">
            <div className="relative space-y-6 border-l-2 border-[#E8F4E6] pl-6">
              {registrations.map((reg) => {
                const event = Array.isArray(reg.events)
                  ? reg.events[0]
                  : reg.events;
                if (!event) return null;

                const dateLabel = event.event_date
                  ? new Date(event.event_date).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Date to be confirmed";

                const isRejected = reg.status === "rejected";

                return (
                  <div key={reg.id} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${
                        isRejected ? "bg-rose-500" : "bg-[#0F6E00]"
                      }`}
                    />

                    <p className="text-sm font-bold leading-snug text-neutral-900">
                      {event.title}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                      <MapPin size={13} className="shrink-0 text-neutral-400" />
                      <span className="truncate">
                        {event.venue || "Venue to be confirmed"}
                      </span>
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isRejected
                            ? "border border-rose-200 bg-rose-50 text-rose-700"
                            : "border border-[#CDE5CA] bg-[#E8F4E6] text-[#0F6E00]"
                        }`}
                      >
                        {isRejected ? "Rejected" : "Registered"}
                      </span>

                      <span className="text-xs text-neutral-500">
                        on{" "}
                        {new Date(reg.registered_at).toLocaleDateString(
                          "en-SG",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>

                    {isRejected && reg.rejection_message && (
                      <div className="mt-2.5 max-w-md rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs leading-relaxed text-rose-800">
                        <span className="font-bold">Reason:</span> &ldquo;
                        {reg.rejection_message}&rdquo;
                      </div>
                    )}

                    <p className="mt-1.5 text-[11px] text-neutral-400">
                      Scheduled: {dateLabel}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 5. Action Hub: Admin Portal, Settings & Logout (Benchmark: Zomato / Marriott) */}
      <section className="space-y-3">
        {member.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-2xl border border-[#CDE5CA] bg-gradient-to-r from-[#F3FAF2] to-white p-4 shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F4E6] text-[#0F6E00] shadow-2xs">
                <ShieldCheck size={20} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 leading-tight">
                  Admin Portal
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 leading-tight">
                  Manage members, events & content
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400" />
          </Link>
        )}

        <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-xs divide-y divide-neutral-100">
          <Link
            href="/member/settings"
            className="flex items-center justify-between p-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100/60"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Settings size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 leading-tight">
                  Settings
                </p>
                <p className="mt-0.5 text-xs text-neutral-400 leading-tight">
                  Notifications, font size & preferences
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-rose-50/40 active:bg-rose-100/40"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <LogOut size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-600 leading-tight">
                  Log Out
                </p>
                <p className="mt-0.5 text-xs text-rose-400 leading-tight">
                  Sign out of your session
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-rose-300" />
          </button>
        </div>
      </section>
    </div>
  );
}
