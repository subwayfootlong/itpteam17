import NavLink from "@/components/ui/NavLink";
import { CalendarCheck, CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { formatMemberDate } from "@/lib/dates";

type RegisteredEvent = {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
  venue: string | null;
  category: string | null;
  imageUrl: string | null;
};

function formatSchedule(eventDate: string, startTime: string | null) {
  const date = formatMemberDate(eventDate);
  if (!startTime) return date;

  const time = new Date(`2000-01-01T${startTime}`);
  if (Number.isNaN(time.getTime())) return `${date} • ${startTime}`;

  return `${date} • ${time.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function HomeRegistrations({
  events,
}: {
  events: RegisteredEvent[];
}) {
  return (
    <section className="mt-7" aria-labelledby="home-registrations-heading">
      <div className="mb-2.5 flex items-center justify-between">
        <h2
          id="home-registrations-heading"
          className="text-base font-bold tracking-tight text-neutral-900 member-dark:text-neutral-100"
        >
          My registrations
        </h2>
        <NavLink
          href="/member/events"
          className="text-xs font-semibold text-brand-primary-800 member-dark:text-brand-primary-200 underline-offset-2 hover:underline"
        >
          See all
        </NavLink>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-neutral-300 member-dark:border-neutral-700 bg-neutral-50 member-dark:bg-neutral-900 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white member-dark:bg-neutral-900 text-brand-primary-800 member-dark:text-brand-primary-200 shadow-xs">
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 member-dark:text-neutral-100">
              No upcoming registrations
            </p>
            <p className="mt-0.5 text-xs text-neutral-600 member-dark:text-neutral-300">
              Browse Pergas events and reserve your place.
            </p>
          </div>
          <NavLink
            href="/member/events"
            className="shrink-0 rounded-full bg-brand-primary-800 px-3.5 py-2 text-xs font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-95"
          >
            Browse
          </NavLink>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 member-dark:divide-neutral-700 overflow-hidden rounded-2xl border border-neutral-200/80 member-dark:border-neutral-700/80 bg-white member-dark:bg-neutral-900 shadow-xs">
          {events.map((event) => (
            <li key={event.id}>
              <NavLink
                href={`/member/events/${event.id}`}
                className="flex items-center gap-3.5 p-3.5 transition-transform duration-100 hover:bg-neutral-50 member-dark:hover:bg-neutral-900 active:scale-[0.98]"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-primary-100 member-dark:bg-brand-primary-900 text-brand-primary-800 member-dark:text-brand-primary-200">
                  {event.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <CalendarCheck size={22} aria-hidden="true" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-950 member-dark:text-neutral-100">
                    {event.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-600 member-dark:text-neutral-300">
                    {formatSchedule(event.eventDate, event.startTime)}
                  </span>
                  {event.venue && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500 member-dark:text-neutral-400">
                      <MapPin size={11} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{event.venue}</span>
                    </span>
                  )}
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-brand-primary-100 member-dark:bg-brand-primary-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-primary-900 member-dark:text-brand-primary-200">
                    Registered
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-neutral-300 member-dark:text-neutral-400"
                    aria-hidden="true"
                  />
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
