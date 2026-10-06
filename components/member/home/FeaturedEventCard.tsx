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
    <article className="flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:border-neutral-200 hover:shadow-md">
      {/* 16:9 Banner Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl || "/event-placeholder.png"}
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Floating Category Chip */}
        <span className="absolute left-3 top-3 rounded-md border border-white/50 bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur-md">
          {event.category || "Featured Event"}
        </span>
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Date Row */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#0F6E00]">
            <CalendarDays size={14} className="shrink-0" />
            <span className="truncate">
              {formatEventSchedule(event.eventDate, event.startTime)}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-1.5 line-clamp-1 text-base font-bold leading-snug text-neutral-900">
            {event.title}
          </h3>

          {/* Venue (if present) */}
          {event.venue && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-neutral-500">
              <MapPin size={13} className="shrink-0 text-neutral-400" />
              <span className="truncate">{event.venue}</span>
            </p>
          )}

          {/* Description clamped */}
          {event.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-600">
              {event.description}
            </p>
          )}
        </div>

        {/* Full-width View Event Button with Pergas Green and guaranteed high-contrast white text */}
        <Link
          href={`/member/events/${event.id}`}
          className="mt-4 block w-full rounded-xl bg-[#0F6E00] px-3 py-2.5 text-center text-xs font-bold shadow-xs transition-all hover:bg-[#173F14] active:scale-[0.98]"
          style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
        >
          <span className="font-bold text-white" style={{ color: "#ffffff" }}>
            View Event
          </span>
        </Link>
      </div>
    </article>
  );
}
