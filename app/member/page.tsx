import Link from "next/link";
import MemberTopBar from "@/components/MemberTopBar";
import MemberBottomNav from "@/components/MemberBottomNav";
import { CalendarDays, CreditCard, Gift, MessageSquare } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        <MemberTopBar />

        <div className="px-5 py-5">
          <h2 className="text-2xl font-bold text-[#151C27]">Home</h2>

          <p className="mt-2 text-[#5F5E5E]">
            Welcome to the Pergas member app.
          </p>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Link
              href="/member/profile"
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <CreditCard size={28} className="text-[#0F6E00]" />
              <h3 className="mt-4 font-semibold text-[#151C27]">
                Digital E-Card
              </h3>
              <p className="mt-1 text-sm text-[#5F5E5E]">
                View your member card
              </p>
            </Link>

            <Link
              href="/member/events"
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <CalendarDays size={28} className="text-[#0F6E00]" />
              <h3 className="mt-4 font-semibold text-[#151C27]">Events</h3>
              <p className="mt-1 text-sm text-[#5F5E5E]">
                Browse upcoming events
              </p>
            </Link>

            <Link
              href="/member/benefits"
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <Gift size={28} className="text-[#0F6E00]" />
              <h3 className="mt-4 font-semibold text-[#151C27]">Benefits</h3>
              <p className="mt-1 text-sm text-[#5F5E5E]">
                View member privileges
              </p>
            </Link>

            <Link
              href="/member/community"
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <MessageSquare size={28} className="text-[#0F6E00]" />
              <h3 className="mt-4 font-semibold text-[#151C27]">Community</h3>
              <p className="mt-1 text-sm text-[#5F5E5E]">
                Connect with members
              </p>
            </Link>
          </div>

          {/* Dummy Announcement */}
          <section className="mt-7">
            <h2 className="text-xl font-bold text-[#0F6E00]">
              Latest Announcement
            </h2>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#151C27]">
                Membership renewal reminder
              </p>
              <p className="mt-2 text-sm text-[#5F5E5E]">
                Please check your profile page for your membership renewal date.
              </p>
            </div>
          </section>

          {/* Dummy Upcoming Event */}
          <section className="mt-7">
            <h2 className="text-xl font-bold text-[#0F6E00]">
              Upcoming Event
            </h2>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="font-semibold text-[#151C27]">
                Classical Arabic Poetry Workshop
              </p>
              <p className="mt-2 text-sm text-[#5F5E5E]">
                6:30 PM - 8:30 PM · Pergas Center, Level 4
              </p>

              <Link
                href="/member/events"
                className="mt-4 block rounded-xl bg-[#0F6E00] py-3 text-center font-semibold text-white"
              >
                View Events
              </Link>
            </div>
          </section>
        </div>

        <MemberBottomNav />
      </section>
    </main>
  );
}