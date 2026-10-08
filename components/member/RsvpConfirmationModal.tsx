"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  Download,
  MailX,
  MapPin,
  QrCode,
} from "lucide-react";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  type CalendarEvent,
} from "@/lib/calendarLinks";
import { formatMemberDate } from "@/lib/dates";

export function CalendarButtons({
  event,
  eventId,
}: {
  event: CalendarEvent;
  eventId: string;
}) {
  const googleUrl = buildGoogleCalendarUrl(event);

  if (!googleUrl) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-brand-primary-800 bg-white px-3 py-2.5 text-center text-xs font-semibold text-brand-primary-800 transition-transform duration-100 hover:bg-brand-primary-50 active:scale-[0.98]"
      >
        <CalendarPlus size={15} aria-hidden="true" />
        Google Calendar
      </a>
      <button
        type="button"
        onClick={() => downloadIcs(event, eventId)}
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-brand-primary-800 bg-white px-3 py-2.5 text-center text-xs font-semibold text-brand-primary-800 transition-transform duration-100 hover:bg-brand-primary-50 active:scale-[0.98]"
      >
        <Download size={15} aria-hidden="true" />
        Apple / Outlook (.ics)
      </button>
    </div>
  );
}

export function CheckInGuidance() {
  return (
    <ul className="space-y-2.5 text-xs text-neutral-700">
      <li className="flex items-start gap-2.5">
        <QrCode
          size={16}
          className="mt-0.5 shrink-0 text-brand-primary-800"
          aria-hidden="true"
        />
        <span>
          <strong className="font-semibold text-neutral-900">
            Check-in at the door:
          </strong>{" "}
          present your digital membership card QR code. Open it any time from
          Profile.
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <MailX
          size={16}
          className="mt-0.5 shrink-0 text-neutral-500"
          aria-hidden="true"
        />
        <span>
          <strong className="font-semibold text-neutral-900">
            No email is sent
          </strong>{" "}
          for event registrations. This confirmation and your Participation
          History on Profile are your record. You do not need a separate ticket.
        </span>
      </li>
    </ul>
  );
}

export default function RsvpConfirmationModal({
  open,
  onClose,
  attendeeName,
  eventId,
  event,
}: {
  open: boolean;
  onClose: () => void;
  attendeeName: string;
  eventId: string;
  event: CalendarEvent;
}) {
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    doneRef.current?.focus();

    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.currentTarget === mouseEvent.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-confirmation-title"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
            <CheckCircle2 size={30} aria-hidden="true" />
          </span>
          <h2
            id="rsvp-confirmation-title"
            className="mt-3 font-butler text-xl font-semibold text-neutral-950"
          >
            You&apos;re registered
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            {attendeeName}, your place is confirmed.
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5">
          <p className="text-sm font-semibold text-neutral-950">{event.title}</p>
          <p className="mt-1 text-xs text-neutral-600">
            {formatMemberDate(event.eventDate)}
            {event.startTime
              ? ` · ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
              : ""}
          </p>
          {event.venue && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
              <MapPin size={13} className="shrink-0" aria-hidden="true" />
              {event.venue}
            </p>
          )}
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
            What happens next
          </h3>
          <CheckInGuidance />
        </div>

        <div className="mt-4">
          <CalendarButtons event={event} eventId={eventId} />
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/member/profile"
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
          >
            View my digital card
          </Link>
          <button
            ref={doneRef}
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-transform duration-100 hover:bg-neutral-100 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
