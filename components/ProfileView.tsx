"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import type { MemberProfile } from "@/app/member/profile/page";
import { formatTierLabel } from "@/lib/membershipTiers";
import { formatSalutationLabel } from "@/lib/memberProfileOptions";
import { formatMemberName } from "@/lib/memberName";
import { formatMemberDate } from "@/lib/dates";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  Edit3,
  Handshake,
  Library,
  LogOut,
  Percent,
  Settings,
  ShieldCheck,
  Star,
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
      subtitle: "Access to member resources",
      icon: Library,
    },
    {
      title: "Event Discovery",
      subtitle: "Browse upcoming Pergas events",
      icon: CalendarCheck,
    },
    {
      title: "Announcements",
      subtitle: "Official Pergas updates",
      icon: BookOpen,
    },
  ],

  student: [
    {
      title: "Digital Library",
      subtitle: "Reference Library",
      icon: Library,
    },
    {
      title: "Discounts",
      subtitle: "10% off program fees",
      icon: Percent,
    },
    {
      title: "Book Purchases",
      subtitle: "15% off books",
      icon: BookOpen,
    },
    {
      title: "Friends of Pergas",
      subtitle: "Partner discounts",
      icon: Handshake,
    },
  ],

  associate: [
    {
      title: "Digital Library",
      subtitle: "Reference Library",
      icon: Library,
    },
    {
      title: "Discounts",
      subtitle: "10% off program fees",
      icon: Percent,
    },
    {
      title: "Book Purchases",
      subtitle: "15% off books",
      icon: BookOpen,
    },
    {
      title: "Friends of Pergas",
      subtitle: "Partner discounts",
      icon: Handshake,
    },
    {
      title: "Priority Entry",
      subtitle: "Early booking",
      icon: CalendarCheck,
    },
    {
      title: "Exclusives",
      subtitle: "Members-only programs",
      icon: Star,
    },
    {
      title: "Magazine Delivery",
      subtitle: "Ar-Risalah quarterly",
      icon: Truck,
    },
  ],

  ordinary: [
    {
      title: "Digital Library",
      subtitle: "Reference Library",
      icon: Library,
    },
    {
      title: "Discounts",
      subtitle: "10% off program fees",
      icon: Percent,
    },
    {
      title: "Book Purchases",
      subtitle: "15% off books",
      icon: BookOpen,
    },
    {
      title: "Friends of Pergas",
      subtitle: "Partner discounts",
      icon: Handshake,
    },
    {
      title: "Priority Entry",
      subtitle: "Early booking",
      icon: CalendarCheck,
    },
    {
      title: "Exclusives",
      subtitle: "Members-only programs",
      icon: Star,
    },
    {
      title: "Magazine Delivery",
      subtitle: "Ar-Risalah quarterly",
      icon: Truck,
    },
    {
      title: "Board Eligibility",
      subtitle: "Run for board member",
      icon: Users,
    },
    {
      title: "Voting Rights",
      subtitle: "Member voting privileges",
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

    router.push("/?screen=login");
    router.refresh();
  }

  const qrValue = JSON.stringify({
    memberId: member.member_id,
    name: formatMemberName(member, "Member Name"),
    status: member.membership_status,
    tier: member.membership_tier,
  });

  return (
    <div className="px-5 py-5">
      {/* Digital E-Card */}
      <section className="relative overflow-hidden rounded-2xl bg-[#149100] p-5 text-white shadow-sm">

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em]">
              {formatTierLabel(member.membership_tier)} Member
            </p>

            <h2 className="mt-2 text-lg font-medium">
              {formatMemberName(member, "Member Name")}
            </h2>

            {member.arabic_name && (
              <p className="mt-1 text-sm text-white/80">{member.arabic_name}</p>
            )}

            <p className="mt-4 text-sm text-white/80">Member ID</p>

            <p className="text-lg font-bold tracking-[0.15em]">
              {member.member_id || "PGS-0000-0000"}
            </p>

            <p className="mt-4 text-xs uppercase text-white/70">
              Valid thru: {formatMemberDate(member.expiry_date)}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <BadgeCheck size={30} />
            </div>

            <div className="rounded-lg bg-white p-2">
              <QRCodeCanvas value={qrValue} size={74} />
            </div>
          </div>
        </div>
      </section>

          {/* Account Details */}
          <section className="mt-6">
            <h2 className="text-2xl font-bold text-[#0F6E00]">
              Account Details
            </h2>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Salutation
                  </p>
                  <p className="mt-1 text-[#151C27]">
                    {formatSalutationLabel(member.salutation) || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Arabic Name
                  </p>
                  <p className="mt-1 text-[#151C27]">
                    {member.arabic_name || "Not available"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-5 sm:col-span-2">
                  <div>
                    <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                      First Name
                    </p>
                    <p className="mt-1 text-[#151C27]">
                      {member.first_name || "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                      Last Name
                    </p>
                    <p className="mt-1 text-[#151C27]">
                      {member.last_name || "Not available"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Organization
                  </p>
                  <p className="mt-1 text-[#151C27]">
                    {member.organization || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Designation
                  </p>
                  <p className="mt-1 text-[#151C27]">
                    {member.designation || "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Email Address
                  </p>
                  <p className="mt-1 text-[#151C27]">{member.email}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Phone Number
                  </p>
                  <p className="mt-1 text-[#151C27]">
                    {member.phone || "Not available"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                      Member Since
                    </p>
                    <p className="mt-1 text-[#151C27]">
                      {formatMemberDate(member.member_since)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                      Renewal Date
                    </p>
                    <p className="mt-1 text-[#151C27]">
                      {formatMemberDate(member.expiry_date)}
                    </p>
                  </div>
              </div>

              <Link
                href="/member/profile/edit"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#9B6500] py-3 font-medium text-[#9B6500]"
              >
                <Edit3 size={18} />
                Edit Profile
              </Link>
            </div>
          </section>

          {/* Active Privileges */}
          <section className="mt-7">
            <h2 className="text-2xl font-bold text-[#0F6E00]">
              Active Privileges
            </h2>

            <div className="mt-4 space-y-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                const isGreen = index % 2 === 1;

                return (
                  <div
                    key={benefit.title}
                    className={`flex items-center gap-4 rounded-lg bg-[#EEF1FF] p-4 ${
                      isGreen ? "border-l-4 border-[#0F6E00]" : "border-l-4 border-[#9B6500]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${
                        isGreen ? "bg-green-100 text-[#0F6E00]" : "bg-gray-200 text-[#9B6500]"
                      }`}
                    >
                      <Icon size={21} />
                    </div>

                    <div>
                      <p className="font-semibold text-[#151C27]">
                        {benefit.title}
                      </p>
                      <p className="text-sm text-[#5F5E5E]">
                        {benefit.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Participation History */}
          <section className="mt-7">
            <h2 className="text-2xl font-bold text-[#0F6E00]">
              Participation History
            </h2>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm font-helvetica">
              {registrations.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  You have not registered for any events yet.
                </div>
              ) : (
                <div className="relative space-y-8 border-l-2 border-gray-200 pl-8">
                  {registrations.map((reg) => {
                    const event = Array.isArray(reg.events) ? reg.events[0] : reg.events;
                    if (!event) return null;

                    const dateLabel = event.event_date
                      ? new Date(event.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'Date to be confirmed';

                    const isRejected = reg.status === 'rejected';

                    return (
                      <div key={reg.id} className="relative">
                        <span className={`absolute -left-[42px] top-1.5 h-4 w-4 rounded-full border-2 border-white shadow-sm ${isRejected ? 'bg-red-500' : 'bg-[#0F6E00]'}`} />
                        <p className="font-bold text-[#151C27] text-base leading-tight">
                          {event.title}
                        </p>
                        <p className="text-sm text-[#5F5E5E] mt-1 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.venue || 'Venue to be confirmed'}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isRejected ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            {isRejected ? 'Rejected' : 'Registered'}
                          </span>
                          <span className="text-xs text-[#5F5E5E] font-medium">
                            on {new Date(reg.registered_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {isRejected && reg.rejection_message && (
                          <div className="mt-2.5 p-3 bg-red-50/50 rounded-xl border border-red-100/50 text-xs text-red-800 leading-normal max-w-md">
                            <span className="font-bold">Reason:</span> &ldquo;{reg.rejection_message}&rdquo;
                          </div>
                        )}
                        <p className="mt-2 text-xs text-gray-400 font-normal">
                          Scheduled: {dateLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Settings and Logout */}
          <div className="mt-7 grid grid-cols-2 gap-4">
            <Link
              href="/member/settings"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-[#EEF1FF] py-4 text-[#151C27]"
            >
              <Settings size={18} />
              Settings
            </Link>

            <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-4 text-red-600">
              <LogOut size={18} />
              Log Out
            </button>
          </div>

          {member.role === "admin" ? (
            <Link
              href="/admin"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0F6E00] bg-[#0F6E00] py-4 font-medium text-white"
            >
              <ShieldCheck size={18} />
              Admin Portal
            </Link>
          ) : null}
    </div>
  );
}
