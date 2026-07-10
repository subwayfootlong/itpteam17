"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to register. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasRsvpLink = Boolean(externalRsvpUrl?.trim());
  const isRegistered = initialRegistration?.status === 'registered';
  const isRejected = initialRegistration?.status === 'rejected';

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {isRejected && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-800">
          <p className="font-bold flex items-center gap-1.5 text-base">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Registration Rejected
          </p>
          {initialRegistration.rejection_message && (
            <p className="mt-2 text-gray-700 font-normal italic">
              &ldquo;{initialRegistration.rejection_message}&rdquo;
            </p>
          )}
          <p className="mt-3 text-xs text-amber-700/80 font-normal">
            You may review the feedback above and reapply using the button below.
          </p>
        </div>
      )}

      {isRegistered ? (
        <button
          type="button"
          disabled
          className="w-full rounded-2xl bg-green-50 border border-green-200 py-4 text-center text-base font-bold text-green-700 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Registered
        </button>
      ) : isFull && !isRejected ? (
        <button
          type="button"
          disabled
          className="w-full rounded-2xl border border-gray-300 bg-gray-50 py-4 text-center text-base font-semibold text-gray-400"
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
          className="block w-full rounded-2xl bg-[#0F6E00] hover:bg-[#0c5900] py-4 text-center text-base font-bold text-white transition-all shadow-md shadow-[#0F6E00]/20"
        >
          Register (External)
        </a>
      ) : (
        <button
          type="button"
          onClick={handleRegister}
          disabled={loading}
          className="w-full rounded-2xl bg-[#0F6E00] hover:bg-[#0c5900] py-4 text-center text-base font-bold text-white transition-all disabled:opacity-50 shadow-md shadow-[#0F6E00]/20"
        >
          {loading ? 'Processing...' : isRejected ? 'Reapply for Event' : 'Register for Event'}
        </button>
      )}
    </div>
  );
}
