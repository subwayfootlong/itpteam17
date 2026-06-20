"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import MemberBottomNav from "@/components/MemberBottomNav";
import {
  ArrowLeft,
  Bell,
  Check,
  ExternalLink,
  FileText,
  Globe,
  LogOut,
  Mail,
  Palette,
  ShieldCheck,
  Type,
  Info,
  ChevronRight,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");

    if (!confirmed) {
      return;
    }

    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        <div className="px-5 py-6">
          {/* Page Header */}
          <header className="flex items-center gap-3">
            <Link href="/member/profile" aria-label="Back to profile">
              <ArrowLeft size={24} className="text-[#0F6E00]" />
            </Link>

            <h1 className="text-2xl font-bold text-[#0F6E00]">Settings</h1>
          </header>

          {/* App Appearance */}
          <section className="mt-10">
            <h2 className="px-2 text-base font-bold text-[#3F473F]">
              App Appearance
            </h2>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* Font Size */}
              <div className="flex items-start gap-4">
                <Type size={24} className="mt-1 text-[#6F7B6F]" />

                <div className="flex-1">
                  <p className="text-lg text-[#151C27]">Font Size</p>

                  <div className="relative mt-5">
                    <div className="h-1 rounded-full bg-[#E8EEF9]" />

                    <div className="absolute left-[33%] top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#0F6E00]" />
                  </div>

                  <div className="mt-3 grid grid-cols-4 text-sm text-[#6F7B6F]">
                    <p>Small</p>
                    <p className="text-center">Medium</p>
                    <p className="text-center">Large</p>
                    <p className="text-right">Extra Large</p>
                  </div>
                </div>
              </div>

              {/* Theme */}
              <Link
                href="#"
                className="mt-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Palette size={24} className="text-[#6F7B6F]" />

                  <div>
                    <p className="text-lg text-[#151C27]">App Theme</p>
                    <p className="text-sm text-[#3F473F]">System Default</p>
                  </div>
                </div>

                <ChevronRight size={22} className="text-[#6F7B6F]" />
              </Link>
            </div>
          </section>

          {/* Common Settings */}
          <section className="mt-10">
            <h2 className="px-2 text-base font-bold text-[#3F473F]">
              Common Settings
            </h2>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell size={24} className="text-[#6F7B6F]" />
                  <p className="text-lg text-[#151C27]">Push Notifications</p>
                </div>

                <button
                  type="button"
                  aria-label="Push notifications enabled"
                  className="relative h-7 w-14 rounded-full bg-[#2EAE23]"
                >
                  <span className="absolute -left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#2F6EEB] text-white">
                    <Check size={20} strokeWidth={3} />
                  </span>
                </button>
              </div>

              {/* Email Notifications */}
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Mail size={24} className="text-[#6F7B6F]" />
                  <p className="text-lg text-[#151C27]">Email Notifications</p>
                </div>

                <button
                  type="button"
                  aria-label="Email notifications disabled"
                  className="h-7 w-7 rounded-full border-4 border-[#E1E9FF]"
                />
              </div>

              {/* Language */}
              <Link
                href="#"
                className="mt-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Globe size={24} className="text-[#6F7B6F]" />

                  <div>
                    <p className="text-lg text-[#151C27]">Language</p>
                    <p className="text-sm text-[#3F473F]">English</p>
                  </div>
                </div>

                <ChevronRight size={22} className="text-[#6F7B6F]" />
              </Link>
            </div>
          </section>

          {/* About & Support */}
          <section className="mt-10">
            <h2 className="px-2 text-base font-bold text-[#3F473F]">
              About & Support
            </h2>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <Link href="#" className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ShieldCheck size={24} className="text-[#6F7B6F]" />
                  <p className="text-lg text-[#151C27]">Privacy Policy</p>
                </div>

                <ExternalLink size={22} className="text-[#6F7B6F]" />
              </Link>

              <Link
                href="#"
                className="mt-8 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <FileText size={24} className="text-[#6F7B6F]" />
                  <p className="text-lg text-[#151C27]">Terms of Service</p>
                </div>

                <ExternalLink size={22} className="text-[#6F7B6F]" />
              </Link>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Info size={24} className="text-[#6F7B6F]" />
                  <p className="text-lg text-[#151C27]">Version Number</p>
                </div>

                <p className="text-sm text-[#3F473F]">2.4.0 (Build 108)</p>
              </div>
            </div>
          </section>

          {/* Log Out */}
          <button
            type="button"
            onClick={handleLogout}
            className="mx-auto mt-14 flex items-center justify-center gap-2 font-bold text-red-600"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>

        <MemberBottomNav />
      </section>
    </main>
  );
}