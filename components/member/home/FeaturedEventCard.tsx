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
    <article className="flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm">
      {/* Banner Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
        {event.imageUrl ? (
          <>
            {/* Ambient blurred backdrop to expand flyer colors into margins */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center scale-110 blur-md opacity-40"
            />

            {/* Uncropped flyer preserving asatizah portraits and typography */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt={event.title}
              className="relative z-10 h-full w-full object-contain object-center drop-shadow-sm"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
          </>
        ) : (
          <div className="relative h-full w-full bg-gradient-to-br from-[#173F14] via-[#245F1B] to-[#0F6E00] flex flex-col items-center justify-center p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 shadow-inner backdrop-blur-md">
              <CalendarDays size={20} className="text-white" />
            </div>
            <span className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-[#BCE6B2]">
              Pergas Event
            </span>
          </div>
        )}

        {/* Floating Category Chip */}
        <span className="absolute left-3 top-3 z-20 rounded-full border border-white/40 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F6E00] shadow-xs backdrop-blur-md">
          {event.category || "Featured Event"}
        </span>
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col justify-between p-4 font-sans">
        <div>
          {/* Date Row */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F6E00]">
            <CalendarDays size={14} className="shrink-0" />
            <span className="truncate">
              {formatEventSchedule(event.eventDate, event.startTime)}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-2 line-clamp-2 text-sm font-bold font-sans leading-snug text-neutral-900">
            {event.title}
          </h3>

          {/* Venue (if present) */}
          {event.venue && (
            <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-neutral-500">
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

        {/* View Event Button with Guaranteed High-Contrast White Text */}
        <Link
          href={`/member/events/${event.id}`}
          className="mt-4 block w-full rounded-xl bg-[#0F6E00] px-3 py-2.5 text-center text-xs font-bold shadow-2xs transition-all hover:bg-[#173F14] active:scale-[0.98]"
          style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
        >
          <span className="font-bold text-white" style={{ color: "#ffffff" }}>
            View Event & RSVP
          </span>
        </Link>
      </div>
    </article>
  );
}
