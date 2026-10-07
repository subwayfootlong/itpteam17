"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface EventRsvpSectionProps {
  eventId: string;
  initialRegistration: {
    id: string;
    status: string;
    rejection_message: string | null;
  } | null;
  externalRsvpUrl: string | null;
  isFull: boolean;
}

export default function EventRsvpSection({
  eventId,
  initialRegistration,
  externalRsvpUrl,
  isFull,
}: EventRsvpSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to register. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasRsvpLink = Boolean(externalRsvpUrl?.trim());
  const isRegistered = initialRegistration?.status === "registered";
  const isRejected = initialRegistration?.status === "rejected";

  return (
    <div className="w-full space-y-3 font-helvetica">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isRejected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
          <p className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            Registration Application Feedback
          </p>
          {initialRegistration?.rejection_message && (
            <p className="mt-1 text-xs italic text-amber-950 break-words">
              &ldquo;{initialRegistration.rejection_message}&rdquo;
            </p>
          )}
          <p className="mt-2 text-[11px] text-amber-700">
            You may review the feedback above and reapply using the button below.
          </p>
        </div>
      )}

      {isRegistered ? (
        <div className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#CDE5CA] bg-[#E8F4E6] px-4 py-3 text-sm font-semibold text-[#0F6E00] shadow-xs">
          <Check size={16} strokeWidth={3} />
          <span>You&apos;re Registered</span>
        </div>
      ) : isFull && !isRejected ? (
        <button
          type="button"
          disabled
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-400 cursor-not-allowed"
        >
          Event is Full
        </button>
      ) : hasRsvpLink ? (
        <a
          href={`/api/events/rsvp?eventId=${eventId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setTimeout(() => router.refresh(), 1000);
          }}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F6E00] px-4 py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#173F14] active:scale-[0.99]"
        >
          Register on External Site ↗
        </a>
      ) : (
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F6E00] px-4 py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#173F14] active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <LoadingSpinner label="Processing…" size="sm" light />
          ) : isRejected ? (
            "Reapply for Event"
          ) : (
            "Register for Event"
          )}
        </button>
      )}
    </div>
  );
}
