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
  KeyRound,
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
    description: "New and updated member perks & discounts",
  },
  {
    key: "announcement",
    title: "Announcements",
    description: "Official Pergas communications & news",
  },
  {
    key: "event",
    title: "Event updates",
    description: "Registration reminders and schedules",
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
      className={`relative h-7 w-12 rounded-full transition-colors ${
        enabled ? "bg-brand-primary-800" : "bg-neutral-200"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-xs transition-all ${
          enabled
            ? "left-[calc(100%-1.5rem)] text-brand-primary-800"
            : "left-1 text-transparent"
        }`}
      >
        {enabled && <Check size={12} strokeWidth={3} />}
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
      className="mb-2 mt-3 grid grid-cols-4 rounded-xl bg-neutral-100 p-1"
    >
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(index)}
            className={`rounded-lg px-2 py-2 text-center text-xs font-semibold transition-all ${
              isSelected
                ? "bg-white text-brand-primary-800 shadow-xs"
                : "text-neutral-500 hover:text-neutral-800"
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
    } catch {
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
    } catch {
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
    <div className="space-y-6 px-4 py-5 font-helvetica">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/member/profile"
          aria-label="Back to profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200/70 active:scale-95"
        >
          <ArrowLeft size={20} className="text-brand-primary-800" />
        </Link>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Settings
          </h1>
          <p className="text-xs text-neutral-500">
            App preferences & notifications
          </p>
        </div>
      </header>

      {/* 1. Appearance */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Appearance
        </h2>

        <div className="mb-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
          <div className="flex items-start gap-3.5 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              <Type size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                Font Size
              </p>
              <p className="text-xs text-neutral-500">
                Adjust reader scale across portal views
              </p>

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

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <Palette size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  App Theme
                </p>
                <p className="text-xs text-neutral-400">
                  System Default (Warm Light)
                </p>
              </div>
            </div>

            <ChevronRight size={18} className="text-neutral-300" />
          </div>
        </div>
      </section>

      {/* 2. Account */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Account
        </h2>

        <div className="mb-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
          <Link
            href="/member/settings/password"
            className="flex items-center gap-3.5 p-4 transition-transform duration-100 hover:bg-neutral-50 active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              <KeyRound size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">Password</p>
              <p className="text-xs text-neutral-500">
                Change your account password
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-neutral-300" />
          </Link>
        </div>
      </section>

      {/* 3. Notifications */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Notifications
        </h2>

        <div className="mb-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Push Notifications
                </p>
                <p className="text-xs text-neutral-500">
                  Master alert control
                </p>
              </div>
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

          <div className="space-y-2.5 p-4">
            {preferenceCopy.map((preference) => (
              <div
                key={preference.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 px-3.5 py-2.5"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-800">
                    {preference.title}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {preference.description}
                  </p>
                </div>

                <SettingsSwitch
                  enabled={preferences[preference.key]}
                  onClick={() => handlePreferenceToggle(preference.key)}
                  disabled={loadingPreferences || savingPush || !pushEnabled}
                  label={
                    preferences[preference.key]
                      ? `${preference.title} enabled`
                      : `${preference.title} disabled`
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Email Notifications
                </p>
                <p className="text-xs text-neutral-400">
                  Coming soon in next release
                </p>
              </div>
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
        </div>
      </section>

      {/* 3. Preferences */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
          Preferences
        </h2>

        <div className="mb-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <Globe size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Language
                </p>
                <p className="text-xs text-neutral-500">
                  English (Singapore)
                </p>
              </div>
            </div>

            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              Default
            </span>
          </div>
        </div>
      </section>

      {/* 4. About & Support */}
      <section>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-neutral-400">
          About & Support
        </h2>

        <div className="mb-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <Info size={18} />
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                Help & Support
              </p>
            </div>
            <ChevronRight size={18} className="text-neutral-300" />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <ShieldCheck size={18} />
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                Privacy Policy
              </p>
            </div>
            <ExternalLink size={16} className="text-neutral-300" />
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                <FileText size={18} />
              </div>
              <p className="text-sm font-semibold text-neutral-900">
                Terms of Service
              </p>
            </div>
            <ExternalLink size={16} className="text-neutral-300" />
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50/50">
            <p className="text-xs text-neutral-500">Pergas Member Portal</p>
            <span className="font-mono text-xs font-medium text-neutral-400">
              v2.4.0 (Build 108)
            </span>
          </div>
        </div>
      </section>

      {/* Log out button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-brand-rose shadow-2xs transition-transform duration-100 hover:bg-rose-50 active:scale-[0.98]"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}
