"use client";

import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import MemberTopBar from "@/components/MemberTopBar";
import MemberBottomNav from "@/components/MemberBottomNav";
import type { MemberProfile } from "@/app/member/profile/page";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  Edit3,
  Gift,
  Handshake,
  Library,
  LogOut,
  Percent,
  Settings,
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

const benefitsByTier: Record<string, Benefit[]> = {
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

  fellow: [
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
    {
      title: "VIP Seats",
      subtitle: "National events access",
      icon: Gift,
    },
  ],

  professional: [
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
    {
      title: "VIP Seats",
      subtitle: "National events access",
      icon: Gift,
    },
  ],
};

function formatDate(date: string | null) {
  if (!date) {
    return "Not available";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTier(tier: string | null) {
  if (!tier) {
    return "Member";
  }

  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function ProfileView({ member }: { member: MemberProfile }) {
  const router = useRouter();
  const tier = member.membership_tier || "ordinary";
  const benefits = benefitsByTier[tier] || benefitsByTier.ordinary;

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
    name: member.full_name,
    status: member.membership_status,
    tier: member.membership_tier,
  });

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        <MemberTopBar />

        <div className="px-5 py-5">
          {/* Digital E-Card */}
          <section className="relative overflow-hidden rounded-2xl bg-[#149100] p-5 text-white shadow-sm">

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em]">
                  {formatTier(member.membership_tier)} Member
                </p>

                <h2 className="mt-2 text-lg font-medium">
                  {member.full_name || "Member Name"}
                </h2>

                {member.arabic_name && (
                  <p className="mt-1 text-sm text-white/80">
                    {member.arabic_name}
                  </p>
                )}

                <p className="mt-4 text-sm text-white/80">Member ID</p>

                <p className="text-lg font-bold tracking-[0.15em]">
                  {member.member_id || "PGS-0000-0000"}
                </p>

                <p className="mt-4 text-xs uppercase text-white/70">
                  Valid thru: {formatDate(member.expiry_date)}
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
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                    Full Name
                  </p>
                  <p className="mt-1 text-[#151C27]">
                    {member.full_name || "Not available"}
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

                <div className="grid grid-cols-2 border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                      Member Since
                    </p>
                    <p className="mt-1 text-[#151C27]">
                      {formatDate(member.member_since)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase text-[#5F5E5E]">
                      Renewal Date
                    </p>
                    <p className="mt-1 text-[#151C27]">
                      {formatDate(member.expiry_date)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9B6500] py-3 font-medium text-[#9B6500]"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              </div>
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

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="relative space-y-8 border-l-2 border-gray-200 pl-8">
                <div className="relative">
                  <span className="absolute -left-[42px] top-1 h-4 w-4 rounded-full bg-[#0F6E00]" />
                  <p className="font-medium text-[#151C27]">
                    Annual Scholars Symposium 2024
                  </p>
                  <p className="text-sm text-[#5F5E5E]">
                    Grand Ballroom, Fairmont Singapore
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-[#2EAE23] px-4 py-2 text-xs font-semibold text-white">
                    Attended
                  </span>
                  <p className="mt-3 text-sm font-medium text-[#5F5E5E]">
                    March 15, 2024
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[42px] top-1 h-4 w-4 rounded-full bg-[#2EAE23]" />
                  <p className="font-medium text-[#151C27]">
                    Community Leadership Workshop
                  </p>
                  <p className="text-sm text-[#5F5E5E]">
                    Pergas Center, Level 4
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-[#2EAE23] px-4 py-2 text-xs font-semibold text-white">
                    Attended
                  </span>
                  <p className="mt-3 text-sm font-medium text-[#5F5E5E]">
                    January 20, 2024
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[42px] top-1 h-4 w-4 rounded-full bg-[#9B6500]" />
                  <p className="font-medium text-[#151C27]">
                    Regional Humanitarian Fundraiser
                  </p>
                  <p className="text-sm text-[#5F5E5E]">
                    Digital Event Zoom
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-orange-300 px-4 py-2 text-xs font-semibold text-[#7A4B00]">
                    Volunteer
                  </span>
                  <p className="mt-3 text-sm font-medium text-[#5F5E5E]">
                    December 05, 2023
                  </p>
                </div>
              </div>

              <Link
                href="#"
                className="mt-8 block text-[#0F6E00]"
              >
                View Full Attendance History →
              </Link>
            </div>
          </section>

          {/* Settings and Logout */}
          <div className="mt-7 grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-[#EEF1FF] py-4 text-[#151C27]"
            >
              <Settings size={18} />
              Settings
            </button>

            <button type="button" onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-4 text-red-600">
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </div>

        <MemberBottomNav />
      </section>
    </main>
  );
}