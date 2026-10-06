"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";

type PasswordField = "current" | "new" | "confirm";

export default function ChangePasswordForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleVisibility(field: PasswordField) {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Please choose a new password that is different from your current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/member/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "We could not update your password. Please try again.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully. Use your new password the next time you log in.");
    } catch {
      setError("We could not connect to the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/member/settings" aria-label="Back to settings">
          <ArrowLeft size={24} className="text-[#0F6E00]" />
        </Link>

        <h1
          id="change-password-title"
          className="member-text-2xl text-2xl font-bold text-[#0F6E00]"
        >
          Change Password
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        aria-labelledby="change-password-title"
        className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#0F6E00]">
            <KeyRound size={20} aria-hidden="true" />
          </span>
          <div>
            <h3 className="member-text-base font-bold text-[#151C27]">Change password</h3>
            <p className="member-text-sm mt-1 text-sm leading-5 text-[#5F5E5E]">
              Enter your current password before choosing a new one.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            id="current-password"
            label="Current password"
            type={visibleFields.current ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            showPasswordToggle
            isPasswordVisible={visibleFields.current}
            onTogglePassword={() => toggleVisibility("current")}
            disabled={isSubmitting}
            required
          />

          <Input
            id="new-password"
            label="New password"
            type={visibleFields.new ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            aria-describedby="new-password-help"
            showPasswordToggle
            isPasswordVisible={visibleFields.new}
            onTogglePassword={() => toggleVisibility("new")}
            disabled={isSubmitting}
            required
          />
          <p id="new-password-help" className="member-text-xs -mt-2 text-xs text-[#5F5E5E]">
            Use at least 8 characters.
          </p>

          <Input
            id="confirm-password"
            label="Confirm new password"
            type={visibleFields.confirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            showPasswordToggle
            isPasswordVisible={visibleFields.confirm}
            onTogglePassword={() => toggleVisibility("confirm")}
            disabled={isSubmitting}
            required
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="member-text-sm mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="member-text-base mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F6E00] px-4 py-3 font-bold text-white transition-colors hover:bg-[#0b5700] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <LoadingSpinner label="Updating password…" size="sm" light />
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
