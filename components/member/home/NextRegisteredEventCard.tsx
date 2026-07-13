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
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="member-text-lg font-semibold text-[#151C27]">
          No upcoming registrations
        </h2>

        <p className="member-text-sm mt-2 text-[#5F5E5E]">
          Browse upcoming Pergas events and reserve your place.
        </p>

        <Link
          href="/member/events"
          className="member-text-base mt-5 block rounded-xl bg-[#0F6E00] px-4 py-3 text-center font-semibold text-white"
        >
          Browse Events
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="member-text-xs font-semibold uppercase tracking-wide text-[#0F6E00]">
        Your Next Event
      </p>

      <h2 className="member-text-lg mt-2 font-semibold text-[#151C27]">
        {event.title}
      </h2>

      <div className="member-text-sm mt-4 space-y-2 text-[#5F5E5E]">
        <p className="flex items-center gap-2">
          <CalendarDays size={18} className="text-[#0F6E00]" />
          <span>{formatEventSchedule(event.eventDate, event.startTime)}</span>
        </p>

        {event.venue && (
          <p className="flex items-center gap-2">
            <MapPin size={18} className="text-[#0F6E00]" />
            <span>{event.venue}</span>
          </p>
        )}
      </div>

      <Link
        href={`/member/events/${event.id}`}
        className="member-text-base mt-5 block rounded-xl bg-[#0F6E00] px-4 py-3 text-center font-semibold text-white"
      >
        View Registration
      </Link>
    </section>
  );
}
