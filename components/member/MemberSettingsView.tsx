"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Info,
  LogOut,
  Mail,
  Palette,
  ShieldCheck,
  Type,
} from "lucide-react";
import {
  MEMBER_FONT_SIZES,
  useMemberFontSize,
} from "@/components/member/MemberFontSizeProvider";
import type { NotificationPreferences } from "@/lib/notifications";
import { LOGOUT_LOGIN_HINT_KEY } from "@/lib/session";

type PreferenceKey = "benefit" | "announcement" | "event";
const PUSH_NOTIFICATIONS_COOKIE = "pergas_push_notifications_enabled";

const preferenceCopy: {
  key: PreferenceKey;
  title: string;
  description: string;
}[] = [
  {
    key: "benefit",
    title: "Benefit updates",
    description: "New and updated member rewards",
  },
  {
    key: "announcement",
    title: "Announcements",
    description: "Official Pergas updates",
  },
  {
    key: "event",
    title: "Event updates",
    description: "Registration windows and event reminders",
  },
];

type SettingsSwitchProps = {
  enabled: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
};

function SettingsSwitch({
  enabled,
  onClick,
  label,
  disabled = false,
}: SettingsSwitchProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={enabled}
      onClick={onClick}
      disabled={disabled}
      className={`relative h-7 w-14 rounded-full transition-colors ${
        enabled ? "bg-[#2EAE23]" : "bg-[#E6EDF2]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <span
        className={`absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition-all ${
          enabled
            ? "left-[calc(100%-1.75rem)] bg-[#2F6EEB] text-white"
            : "left-1 bg-white text-transparent"
        }`}
      >
        {enabled && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  );
}

type PreferencesResponse = {
  preferences?: NotificationPreferences;
  error?: string;
};

type SegmentedControlProps = {
  label: string;
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
};

function SegmentedControl({
  label,
  options,
  selectedIndex,
  onChange,
}: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="mb-2 mt-3 grid grid-cols-4 rounded-2xl bg-[#F4F7F4] p-1"
    >
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(index)}
            className={`member-text-sm rounded-[14px] px-2 py-3 text-center text-sm font-medium transition-colors ${
              isSelected
                ? "bg-[#0F6E00] text-white shadow-[0_6px_18px_rgba(15,110,0,0.2)]"
                : "text-[#6F7B6F]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default function MemberSettingsView({
  initialPreferences,
  initialPushEnabled,
}: {
  initialPreferences: NotificationPreferences;
  initialPushEnabled: boolean;
}) {
  const router = useRouter();
  const { fontSize, setFontSize } = useMemberFontSize();

  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    initialPreferences,
  );
  const [loadingPreferences] = useState(false);
  const [savingPush, setSavingPush] = useState(false);
  const fontSizeIndex = MEMBER_FONT_SIZES.indexOf(fontSize);

  async function handlePushToggle() {
    if (savingPush || loadingPreferences) {
      return;
    }

    const nextValue = !pushEnabled;
    const previousValue = pushEnabled;

    setPushEnabled(nextValue);
    setSavingPush(true);

    try {
      document.cookie = `${PUSH_NOTIFICATIONS_COOKIE}=${nextValue ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    } catch (error) {
      setPushEnabled(previousValue);
    } finally {
      setSavingPush(false);
    }
  }

  async function handlePreferenceToggle(key: PreferenceKey) {
    if (loadingPreferences || savingPush) {
      return;
    }

    const previousPreferences = preferences;
    const nextPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(nextPreferences);

    try {
      const response = await fetch("/api/member/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextPreferences[key] }),
      });
      const result = (await response.json().catch(() => ({}))) as PreferencesResponse;

      if (!response.ok || !result.preferences) {
        throw new Error(result.error ?? "Unable to save notification settings.");
      }

      setPreferences(result.preferences);
    } catch (error) {
      setPreferences(previousPreferences);
    }
  }

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

  function handleFontSizeChange(index: number) {
    const selectedSize = MEMBER_FONT_SIZES[index];

    if (selectedSize) {
      setFontSize(selectedSize);
    }
  }

  return (
    <div className="px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/member/profile" aria-label="Back to profile">
          <ArrowLeft size={24} className="text-[#0F6E00]" />
        </Link>

        <h1 className="member-text-2xl text-2xl font-bold text-[#0F6E00]">Settings</h1>
      </header>

      <section className="mt-10">
        <h2 className="member-text-base px-2 text-base font-bold text-[#3F473F]">
          Appearance
        </h2>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-4">
            <Type size={24} className="mt-1 text-[#6F7B6F]" />

            <div className="flex-1">
              <p className="member-text-lg text-lg text-[#151C27]">Font Size</p>

              <SegmentedControl
                label="Font Size"
                options={["Small", "Default", "Large", "Extra Large"]}
                selectedIndex={fontSizeIndex}
                onChange={handleFontSizeChange}
              />

              <p className="sr-only" aria-live="polite">
                Font size set to{" "}
                {fontSize === "extraLarge"
                  ? "Extra Large"
                  : fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
              </p>
            </div>
          </div>

          <Link href="#" className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Palette size={24} className="text-[#6F7B6F]" />

              <div>
                <p className="member-text-lg text-lg text-[#151C27]">App Theme</p>
                <p className="member-text-sm text-sm text-[#3F473F]">System Default</p>
              </div>
            </div>

            <ChevronRight size={22} className="text-[#6F7B6F]" />
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="member-text-base px-2 text-base font-bold text-[#3F473F]">
          Notifications
        </h2>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Bell size={24} className="text-[#6F7B6F]" />
              <p className="member-text-lg text-lg text-[#151C27]">Push Notifications</p>
            </div>

            <SettingsSwitch
              enabled={pushEnabled}
              onClick={handlePushToggle}
              disabled={loadingPreferences || savingPush}
              label={
                pushEnabled
                  ? "Push notifications enabled"
                  : "Push notifications disabled"
              }
            />
          </div>

          <p className="member-text-sm mt-3 text-sm text-[#5F5E5E]">
            Push notifications control benefit, announcement, and event alerts.
          </p>

          <div className="mt-5 space-y-3">
            {preferenceCopy.map((preference) => (
              <div
                key={preference.key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-[#F8FAF8] px-4 py-3"
              >
                <div>
                  <p className="member-text-base text-base font-semibold text-[#151C27]">
                    {preference.title}
                  </p>
                  <p className="member-text-sm mt-1 text-sm text-[#5F5E5E]">
                    {preference.description}
                  </p>
                </div>

                <SettingsSwitch
                  enabled={preferences[preference.key]}
                  onClick={() => handlePreferenceToggle(preference.key)}
                  disabled={
                    loadingPreferences || savingPush || !pushEnabled
                  }
                  label={
                    preferences[preference.key]
                      ? `${preference.title} enabled`
                      : `${preference.title} disabled`
                  }
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Mail size={24} className="text-[#6F7B6F]" />
              <p className="member-text-lg text-lg text-[#151C27]">Email Notifications</p>
            </div>

            <SettingsSwitch
              enabled={emailEnabled}
              onClick={() => setEmailEnabled((value) => !value)}
              disabled
              label={
                emailEnabled
                  ? "Email notifications enabled"
                  : "Email notifications disabled"
              }
            />
          </div>

          <p className="member-text-sm mt-3 text-sm text-[#5F5E5E]">
            Email notifications are not connected yet.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="member-text-base px-2 text-base font-bold text-[#3F473F]">
          Preferences
        </h2>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <Link href="#" className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Globe size={24} className="text-[#6F7B6F]" />

              <div>
                <p className="member-text-lg text-lg text-[#151C27]">Language</p>
                <p className="member-text-sm text-sm text-[#3F473F]">English</p>
              </div>
            </div>

            <ChevronRight size={22} className="text-[#6F7B6F]" />
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="member-text-base px-2 text-base font-bold text-[#3F473F]">
          About & Support
        </h2>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <Link href="#" className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Info size={24} className="text-[#6F7B6F]" />
              <p className="member-text-lg text-lg text-[#151C27]">Help & Support</p>
            </div>

            <ChevronRight size={22} className="text-[#6F7B6F]" />
          </Link>

          <Link href="#" className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ShieldCheck size={24} className="text-[#6F7B6F]" />
              <p className="member-text-lg text-lg text-[#151C27]">Privacy Policy</p>
            </div>

            <ExternalLink size={22} className="text-[#6F7B6F]" />
          </Link>

          <Link href="#" className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-[#6F7B6F]" />
              <p className="member-text-lg text-lg text-[#151C27]">Terms of Service</p>
            </div>

            <ExternalLink size={22} className="text-[#6F7B6F]" />
          </Link>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Info size={24} className="text-[#6F7B6F]" />
              <p className="member-text-lg text-lg text-[#151C27]">Version 2.4.0 (Build 108)</p>
            </div>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="member-text-base mx-auto mt-14 flex items-center justify-center gap-2 font-bold text-red-600"
      >
        <LogOut size={20} />
        Log Out
      </button>
    </div>
  );
}
