import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import MemberPageShell from "@/components/member/MemberPageShell";
import type { EventRow } from "@/app/member/events/page";
import { getCurrentUser } from "@/lib/currentUser";
import { formatMemberDate } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function formatTime(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Time to be confirmed";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime;
}

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    notFound();
  }

  const { id } = await params;

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .select(
      "id, title, description, event_date, start_time, end_time, venue, image_url, external_rsvp_url, category, capacity, spots_available, status",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const eventRecord = event as EventRow;

  // Track event details view in database
  await supabaseAdmin.from("analytics_events").insert({
    user_id: currentUser.id,
    event_type: "event_view",
    target_id: eventRecord.id,
    category: "event",
    metadata: { title: eventRecord.title, category: eventRecord.category || "General" }
  });

  const hasRsvpLink = Boolean(eventRecord.external_rsvp_url?.trim());
  const isFull = eventRecord.spots_available !== null && eventRecord.spots_available <= 0;
  const registerLabel = isFull ? "Full" : hasRsvpLink ? "Register" : "Unavailable";

  return (
    <MemberPageShell showTopBar={false}>
      <div className="px-5 py-6">
        <header className="flex items-center gap-3">
          <Link href="/member/events" aria-label="Back to events">
            <ArrowLeft size={24} className="text-[#0F6E00]" />
          </Link>
          <h1 className="line-clamp-2 text-2xl font-bold text-[#0F6E00]">
            {eventRecord.title}
          </h1>
        </header>

        <article className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(18,44,22,0.1)]">
          <div className="relative h-64 bg-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={eventRecord.image_url || "/event-placeholder.jpg"}
              alt={eventRecord.title}
              className="h-full w-full object-cover"
            />

            {eventRecord.category && (
              <span className="absolute left-5 top-5 rounded-full bg-[rgba(15,110,0,0.92)] px-4 py-1.5 text-sm font-semibold text-white">
                {eventRecord.category}
              </span>
            )}
          </div>

          <div className="space-y-6 p-6">
            <div>
              <h2 className="text-[2rem] font-bold leading-tight text-[#151C27]">
                {eventRecord.title}
              </h2>
              {eventRecord.description && (
                <p className="mt-4 whitespace-pre-line break-words text-base leading-7 text-[#4F5B53]">
                  {eventRecord.description}
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Date
                    </p>
                    <p className="mt-1 text-base text-[#151C27]">
                      {formatMemberDate(eventRecord.event_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <Clock size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Time
                    </p>
                    <p className="mt-1 text-base text-[#151C27]">
                      {formatTime(eventRecord.start_time, eventRecord.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <MapPin size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Venue
                    </p>
                    <p className="mt-1 text-base text-[#151C27]">
                      {eventRecord.venue || "Venue to be confirmed"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <Users size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Availability
                    </p>
                    <p className="mt-1 text-base text-[#151C27]">
                      {eventRecord.spots_available !== null
                        ? `${eventRecord.spots_available} spot${eventRecord.spots_available === 1 ? "" : "s"} left`
                        : "Availability to be confirmed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {!isFull && hasRsvpLink ? (
              <a
                href={`/api/events/rsvp?eventId=${eventRecord.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl bg-[#0F6E00] px-5 py-4 text-center text-base font-semibold text-white"
              >
                {registerLabel}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full rounded-2xl border border-[#5F5E5E] px-5 py-4 text-base font-semibold text-[#151C27]"
              >
                {registerLabel}
              </button>
            )}
          </div>
        </article>
      </div>
    </MemberPageShell>
  );
}
