import NavLink from "@/components/ui/NavLink";
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
      <section className="mt-4 overflow-hidden rounded-2xl border border-dashed border-stone-200 member-dark:border-neutral-700 bg-stone-50/70 member-dark:bg-neutral-900/70 p-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200/80 member-dark:border-neutral-700/80 bg-white member-dark:bg-neutral-900 text-[#0F6E00] member-dark:text-brand-primary-200 shadow-2xs">
            <CalendarDays size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold font-sans leading-tight text-neutral-900 member-dark:text-neutral-100">
              No upcoming registrations
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600 member-dark:text-neutral-300">
              Browse upcoming Pergas gatherings, lectures, and community events.
            </p>
            <NavLink
              href="/member/events"
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#0F6E00] member-dark:text-brand-primary-200 transition-colors hover:text-[#173F14] member-dark:hover:text-brand-primary-100"
            >
              <span>Explore upcoming events</span>
              <span aria-hidden="true">&rarr;</span>
            </NavLink>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-stone-200/80 member-dark:border-neutral-700/80 bg-white member-dark:bg-neutral-900 p-4.5 shadow-xs transition-all hover:border-neutral-300 member-dark:hover:border-neutral-700 hover:shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CDE5CA] member-dark:border-neutral-700 bg-[#E8F4E6] member-dark:bg-neutral-800 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F6E00] member-dark:text-brand-primary-200">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E00]" />
          <span>Your Registered Pass</span>
        </span>

        {event.category && (
          <span className="rounded-md border border-stone-200/70 member-dark:border-neutral-700/70 bg-stone-100 member-dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-stone-600 member-dark:text-neutral-300">
            {event.category}
          </span>
        )}
      </div>

      <h2 className="mt-2.5 text-base font-bold font-sans leading-snug text-neutral-900 member-dark:text-neutral-100">
        {event.title}
      </h2>

      <div className="mt-3 space-y-1.5 text-xs text-neutral-600 member-dark:text-neutral-300">
        <p className="flex items-center gap-2 font-medium text-[#0F6E00] member-dark:text-brand-primary-200">
          <CalendarDays size={14} className="shrink-0 text-[#0F6E00] member-dark:text-brand-primary-200" />
          <span>{formatEventSchedule(event.eventDate, event.startTime)}</span>
        </p>

        {event.venue && (
          <p className="flex items-center gap-2 text-neutral-500 member-dark:text-neutral-400">
            <MapPin size={14} className="shrink-0 text-neutral-400 member-dark:text-neutral-400" />
            <span className="truncate">{event.venue}</span>
          </p>
        )}
      </div>

      {/* High-contrast brand green CTA button */}
      <NavLink
        href={`/member/events/${event.id}`}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F6E00] px-4 py-2.5 text-center text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#173F14] active:scale-[0.98]"
        style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
      >
        <span className="font-bold text-white" style={{ color: "#ffffff" }}>
          View Registration Pass
        </span>
        <span aria-hidden="true">&rarr;</span>
      </NavLink>
    </section>
  );
}
