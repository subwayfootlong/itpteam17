import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatMemberDate } from "@/lib/dates";

type NextRegisteredEvent = {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
  venue: string | null;
  category: string | null;
  imageUrl: string | null;
};

function formatEventSchedule(eventDate: string, startTime: string | null) {
  const formattedDate = formatMemberDate(eventDate);

  if (!startTime) {
    return formattedDate;
  }

  const timeValue = new Date(`2000-01-01T${startTime}`);
  const formattedTime = Number.isNaN(timeValue.getTime())
    ? startTime
    : timeValue.toLocaleTimeString("en-SG", {
        hour: "numeric",
        minute: "2-digit",
      });

  return `${formattedDate} • ${formattedTime}`;
}

export default function NextRegisteredEventCard({
  event,
}: {
  event: NextRegisteredEvent | null;
}) {
  if (!event) {
    return (
      <section className="mt-7 overflow-hidden rounded-2xl border border-neutral-100 bg-stone-50/70 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200/60 bg-white text-[#0F6E00] shadow-2xs">
            <CalendarDays size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold leading-tight text-neutral-900">
              No upcoming registrations
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Browse upcoming Pergas gatherings, lectures, and community events.
            </p>
            <Link
              href="/member/events"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#0F6E00] transition-colors hover:text-[#173F14]"
            >
              <span>Explore upcoming events</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-7 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-4.5 shadow-sm transition-all hover:border-neutral-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CDE5CA] bg-[#E8F4E6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F6E00]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E00]" />
          <span>Your Registered Pass</span>
        </span>

        {event.category && (
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {event.category}
          </span>
        )}
      </div>

      <h2 className="mt-2.5 text-base font-bold leading-snug text-neutral-900">
        {event.title}
      </h2>

      <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
        <p className="flex items-center gap-2 font-medium text-[#0F6E00]">
          <CalendarDays size={14} className="shrink-0 text-[#0F6E00]" />
          <span>{formatEventSchedule(event.eventDate, event.startTime)}</span>
        </p>

        {event.venue && (
          <p className="flex items-center gap-2 text-neutral-500">
            <MapPin size={14} className="shrink-0 text-neutral-400" />
            <span className="truncate">{event.venue}</span>
          </p>
        )}
      </div>

      <Link
        href={`/member/events/${event.id}`}
        className="mt-4 block w-full rounded-xl bg-neutral-900 px-3 py-2.5 text-center text-xs font-semibold text-white shadow-xs transition-all hover:bg-black active:scale-[0.98]"
      >
        View Registration
      </Link>
    </section>
  );
}
