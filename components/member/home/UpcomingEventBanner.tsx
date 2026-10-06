import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { formatMemberDate } from "@/lib/dates";

type UpcomingEvent = {
  id: string;
  title: string;
  eventDate: string;
  startTime: string | null;
  venue: string | null;
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

export default function UpcomingEventBanner({
  event,
}: {
  event: UpcomingEvent;
}) {
  return (
    <section className="mt-4 rounded-xl border border-[#D9E8D7] bg-[#F3FAF2] p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-[#DDF3D9] p-2 text-[#0F6E00]">
          <CalendarDays size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="member-text-xs font-semibold uppercase tracking-wide text-[#0F6E00]">
            Next upcoming event
          </p>

          <h2 className="member-text-lg mt-2 font-semibold text-[#151C27]">
            {event.title}
          </h2>

          <p className="member-text-sm mt-2 text-[#5F5E5E]">
            {formatEventSchedule(event.eventDate, event.startTime)}
          </p>

          {event.venue && (
            <p className="member-text-sm mt-1 flex items-center gap-2 text-[#5F5E5E]">
              <MapPin size={16} className="text-[#0F6E00]" />
              <span>{event.venue}</span>
            </p>
          )}

          <Link
            href={`/member/events/${event.id}`}
            className="member-text-sm mt-4 inline-block font-semibold text-[#0F6E00]"
          >
            View event
          </Link>
        </div>
      </div>
    </section>
  );
}
