import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatMemberDate } from "@/lib/dates";

type FeaturedEvent = {
  id: string;
  title: string;
  description: string | null;
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

export default function FeaturedEventCard({
  event,
}: {
  event: FeaturedEvent;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="relative h-48 bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl || "/event-placeholder.png"}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute left-5 top-5">
          <span className="rounded-full bg-[#0F6E00] px-3 py-1 text-sm font-semibold text-white">
            Featured Event
          </span>
        </div>
      </div>

      <div className="p-5">
        {event.category && (
          <p className="member-text-xs font-semibold uppercase tracking-wide text-[#0F6E00]">
            {event.category}
          </p>
        )}

        <h2 className="member-text-lg mt-2 font-semibold text-[#151C27]">
          {event.title}
        </h2>

        {event.description && (
          <p className="member-text-sm mt-2 line-clamp-3 text-[#5F5E5E]">
            {event.description}
          </p>
        )}

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
          View Event
        </Link>
      </div>
    </section>
  );
}
