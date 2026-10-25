"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { CalendarEvent } from "@/lib/calendarLinks";
import RsvpConfirmationModal, {
  CalendarButtons,
  CheckInGuidance,
} from "@/components/member/RsvpConfirmationModal";

interface EventRsvpSectionProps {
  eventId: string;
  initialRegistration: {
    id: string;
    status: string;
    rejection_message: string | null;
  } | null;
  externalRsvpUrl: string | null;
  isFull: boolean;
  attendeeName: string;
  event: CalendarEvent;
}

export default function EventRsvpSection({
  eventId,
  initialRegistration,
  externalRsvpUrl,
  isFull,
  attendeeName,
  event,
}: EventRsvpSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
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
        setShowConfirmation(true);
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

  const handleCancel = async () => {
    setError("");
    setCancelling(true);

    try {
      const res = await fetch("/api/events/rsvp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        setConfirmingCancel(false);
        setShowConfirmation(false);
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to cancel your registration. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setCancelling(false);
    }
  };

  const hasRsvpLink = Boolean(externalRsvpUrl?.trim());
  const isRegistered = initialRegistration?.status === "registered";
  const isRejected = initialRegistration?.status === "rejected";

  const todayKey = new Date().toLocaleDateString("en-CA");
  const hasEnded = Boolean(event.eventDate && event.eventDate < todayKey);

  return (
    <div className="w-full space-y-3 font-helvetica">
      {error && (
        <div className="rounded-xl border border-red-200 member-dark:border-red-800 bg-red-50 member-dark:bg-red-950 p-3 text-xs font-medium text-red-700 member-dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isRejected && (
        <div className="rounded-xl border border-amber-200 member-dark:border-amber-800 bg-amber-50/80 member-dark:bg-amber-950/80 p-3.5 text-xs text-amber-900 member-dark:text-amber-300">
          <p className="flex items-center gap-1.5 font-bold text-amber-800 member-dark:text-amber-300">
            <AlertCircle size={15} className="text-amber-600 member-dark:text-amber-300 shrink-0" />
            Registration Application Feedback
          </p>
          {initialRegistration?.rejection_message && (
            <p className="mt-1 text-xs italic text-amber-950 member-dark:text-amber-300 break-words">
              &ldquo;{initialRegistration.rejection_message}&rdquo;
            </p>
          )}
          <p className="mt-2 text-[11px] text-amber-700 member-dark:text-amber-300">
            You may review the feedback above and reapply using the button below.
          </p>
        </div>
      )}

      {isRegistered ? (
        <div className="space-y-4 rounded-2xl border border-brand-primary-200 member-dark:border-brand-primary-700 bg-brand-primary-50 member-dark:bg-brand-primary-900 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary-800 text-white">
              <Check size={18} strokeWidth={3} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-primary-900 member-dark:text-brand-primary-200">
                You&apos;re registered
              </p>
              <p className="text-xs text-neutral-600 member-dark:text-neutral-300">
                {attendeeName}, your place is confirmed.
              </p>
            </div>
          </div>

          <CheckInGuidance />

          <CalendarButtons event={event} eventId={eventId} />

          {!hasEnded && (
            <div className="border-t border-brand-primary-200/70 member-dark:border-brand-primary-700/70 pt-3">
              {confirmingCancel ? (
                <div role="alertdialog" aria-label="Confirm cancellation">
                  <p className="text-xs font-semibold text-neutral-900 member-dark:text-neutral-100">
                    Cancel your registration for this event?
                  </p>
                  <p className="mt-0.5 text-[11px] text-neutral-600 member-dark:text-neutral-300">
                    Your place will be released for other members.
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      disabled={cancelling}
                      className="min-h-10 rounded-xl border border-neutral-300 member-dark:border-neutral-700 bg-white member-dark:bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-700 member-dark:text-neutral-300 transition-transform duration-100 active:scale-[0.98] disabled:opacity-50"
                    >
                      Keep my place
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="min-h-10 rounded-xl bg-brand-rose px-3 py-2 text-xs font-semibold text-white transition-transform duration-100 active:scale-[0.98] disabled:opacity-50"
                    >
                      {cancelling ? (
                        <LoadingSpinner label="Cancelling…" size="sm" light />
                      ) : (
                        "Yes, cancel"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="text-xs font-semibold text-brand-rose member-dark:text-rose-300 underline underline-offset-2 transition-transform duration-100 active:scale-95"
                >
                  Cancel RSVP
                </button>
              )}
            </div>
          )}
        </div>
      ) : isFull && !isRejected ? (
        <button
          type="button"
          disabled
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-200 member-dark:border-neutral-700 bg-neutral-100 member-dark:bg-neutral-800 px-4 py-3 text-sm font-medium text-neutral-400 member-dark:text-neutral-400 cursor-not-allowed"
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
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-primary-800 px-4 py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-primary-900 active:scale-[0.98]"
        >
          Register on External Site ↗
        </a>
      ) : (
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-primary-800 px-4 py-3 text-center text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-primary-900 active:scale-[0.98] disabled:opacity-50"
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

      <RsvpConfirmationModal
        open={showConfirmation && isRegistered}
        onClose={() => setShowConfirmation(false)}
        attendeeName={attendeeName}
        eventId={eventId}
        event={event}
      />
    </div>
  );
}
