"use client";

import { useEffect, useState } from "react";
import { formatMemberDate } from "@/lib/dates";
import { formatTierLabel } from "@/lib/membershipTiers";

type Result = { valid: true; member: {
  displayName: string; membershipTier: string | null;
  membershipStatus: string | null; expiryDate: string | null;
} } | { valid: false; code: string };

export default function MembershipVerification({ token }: { token: string }) {
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/verify/member?token=${encodeURIComponent(token)}`, {
      cache: "no-store", signal: controller.signal, referrerPolicy: "no-referrer",
    }).then(async (response) => {
      const data = await response.json();
      if (!controller.signal.aborted) setResult(data);
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ valid: false, code: "unavailable" });
    });
    return () => controller.abort();
  }, [token]);

  // Membership dates are inclusive calendar dates in Pergas's local timezone.
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const active = result?.valid && result.member.membershipStatus === "active" &&
    (!result.member.expiryDate || result.member.expiryDate >= today);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-5">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" aria-live="polite">
        <h1 className="text-xl font-bold text-[#0F6E00]">Pergas Membership Verification</h1>
        {!result ? <p className="mt-5">Verifying membership...</p> : result.valid ? <>
          <h2 className={`mt-5 text-lg font-semibold ${active ? "text-green-700" : "text-amber-800"}`}>
            {active ? "Membership Verified" : "Membership Not Active"}
          </h2>
          {!active && <p className="mt-2 text-sm">This QR is authentic, but the membership is not currently active.</p>}
          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <dt>Name</dt><dd>{result.member.displayName}</dd>
            <dt>Tier</dt><dd>{formatTierLabel(result.member.membershipTier)}</dd>
            <dt>Status</dt><dd className="capitalize">{result.member.membershipStatus || "Unavailable"}</dd>
            <dt>Valid Until</dt><dd>{formatMemberDate(result.member.expiryDate)}</dd>
          </dl>
        </> : <>
          <h2 className="mt-5 text-lg font-semibold text-red-700">
            {result.code === "expired" ? "QR Expired" : result.code === "unavailable" ? "Verification Unavailable" : "Invalid Membership QR"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {result.code === "expired" ? "Please ask the member to refresh their digital membership card." : result.code === "unavailable" ? "Unable to verify membership. Please try again." : "This QR could not be verified."}
          </p>
        </>}
      </section>
    </main>
  );
}
