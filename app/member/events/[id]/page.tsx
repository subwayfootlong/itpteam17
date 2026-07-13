import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import MemberPageShell from "@/components/member/MemberPageShell";
import type { EventRow } from "@/app/member/events/page";
import { getCurrentUser } from "@/lib/currentUser";
import { formatMemberDate } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabaseServer";
import EventRsvpSection from "@/components/member/EventRsvpSection";

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

  // Fetch current user's registration for this event
  const { data: registration } = await supabaseAdmin
    .from("event_registrations")
    .select("id, status, rejection_message")
    .eq("event_id", id)
    .eq("user_id", currentUser.id)
    .maybeSingle();

  // Track event details view in database
  await supabaseAdmin.from("analytics_events").insert({
    user_id: currentUser.id,
    event_type: "event_view",
    target_id: eventRecord.id,
    category: "event",
    metadata: { title: eventRecord.title, category: eventRecord.category || "General" }
  });

  const isFull = eventRecord.spots_available !== null && eventRecord.spots_available <= 0;

  return (
    <MemberPageShell showTopBar={false}>
      <div className="px-5 py-6">
        <header className="flex items-center gap-3">
          <Link href="/member/events" aria-label="Back to events">
            <ArrowLeft size={24} className="text-[#0F6E00]" />
          </Link>
          <h1 className="member-text-2xl line-clamp-2 text-2xl font-bold text-[#0F6E00]">
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
              <span className="member-text-sm absolute left-5 top-5 rounded-full bg-[rgba(15,110,0,0.92)] px-4 py-1.5 text-sm font-semibold text-white">
                {eventRecord.category}
              </span>
            )}
          </div>

          <div className="space-y-6 p-6">
            <div>
              <h2 className="member-text-2xl text-[2rem] font-bold leading-tight text-[#151C27]">
                {eventRecord.title}
              </h2>
              {eventRecord.description && (
                <p className="member-text-base mt-4 whitespace-pre-line break-words text-base leading-7 text-[#4F5B53]">
                  {eventRecord.description}
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="member-text-sm text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Date
                    </p>
                    <p className="member-text-base mt-1 min-w-0 break-words text-[#151C27]">
                      {formatMemberDate(eventRecord.event_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <Clock size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="member-text-sm text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Time
                    </p>
                    <p className="member-text-base mt-1 min-w-0 break-words text-[#151C27]">
                      {formatTime(eventRecord.start_time, eventRecord.end_time)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <MapPin size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="member-text-sm text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Venue
                    </p>
                    <p className="member-text-base mt-1 min-w-0 break-words text-[#151C27]">
                      {eventRecord.venue || "Venue to be confirmed"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF6] p-4">
                <div className="flex items-start gap-3">
                  <Users size={20} strokeWidth={2.2} className="mt-0.5 text-[#0F6E00]" />
                  <div>
                    <p className="member-text-sm text-sm font-semibold uppercase tracking-[0.12em] text-[#6D786F]">
                      Availability
                    </p>
                    <p className="member-text-base mt-1 min-w-0 break-words text-[#151C27]">
                      {eventRecord.spots_available !== null
                        ? `${eventRecord.spots_available} spot${eventRecord.spots_available === 1 ? "" : "s"} left`
                        : "Availability to be confirmed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <EventRsvpSection
              eventId={eventRecord.id}
              initialRegistration={registration}
              externalRsvpUrl={eventRecord.external_rsvp_url}
              isFull={isFull}
            />
          </div>
        </article>
      </div>
    </MemberPageShell>
  );
}
