"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ChangeEmailView() {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function submit(action: "request" | "verify") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/member/email-change/${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "request" ? { newEmail, currentPassword } : { otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to change email.");
      if (action === "request") {
        setMaskedEmail(result.maskedEmail);
        setCooldown(result.retryAfter);
        setCurrentPassword("");
        setOtp("");
      } else {
        setSuccess(true);
        window.setTimeout(() => window.location.replace("/?screen=login"), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change email. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/member/settings" aria-label="Back to settings" className="shrink-0">
          <ArrowLeft size={24} className="text-[#0F6E00]" />
        </Link>
        <h1 className="member-text-2xl text-2xl font-bold text-[#0F6E00]">{maskedEmail ? "Verify New Email" : "Change Email"}</h1>
      </header>
      {success ? <p role="status" className="member-text-sm mt-8 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Email changed successfully. Please log in again with your new email and existing password.</p> : (
        <form className="mt-8 space-y-5" onSubmit={(event) => { event.preventDefault(); void submit(maskedEmail ? "verify" : "request"); }}>
          <p className="member-text-sm text-sm text-[#5F5E5E]">{maskedEmail ? `We sent a verification code to ${maskedEmail}. It expires in 10 minutes.` : "Verify your current password and your new email address. You will be logged out after the change."}</p>
          {!maskedEmail ? <>
            <Input label="New email address" type="email" autoComplete="email" maxLength={254} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required disabled={busy} />
            <Input label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required disabled={busy} />
          </> : <>
            <Input label="Verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required disabled={busy} />
            <p className="member-text-sm text-sm text-[#5F5E5E]">Your login email stays unchanged until verification succeeds.</p>
          </>}
          {error && <p role="alert" className="member-text-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="pt-2">
            <Button type="submit" loading={busy} disabled={busy}>{maskedEmail ? "Verify Email" : "Send verification code"}</Button>
          </div>
          {maskedEmail && <div className="space-y-5 border-t border-gray-200 pt-5">
            <Input label="Current password (required to resend)" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={busy} />
            <button type="button" className="member-text-base flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-[#151C27] disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || cooldown > 0 || !currentPassword} onClick={() => void submit("request")}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</button>
            <button type="button" className="member-text-sm block text-sm font-semibold text-[#0F6E00] disabled:opacity-50" disabled={busy} onClick={() => { setMaskedEmail(""); setOtp(""); setError(""); setCurrentPassword(""); }}>Use a different email address</button>
          </div>}
        </form>
      )}
    </div>
  );
}
