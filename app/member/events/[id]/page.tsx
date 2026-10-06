import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import MemberPageShell from "@/components/member/MemberPageShell";
import type { EventRow } from "@/app/member/events/page";
import { getCurrentUser } from "@/lib/currentUser";
import { formatMemberDate } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabaseServer";
import EventRsvpSection from "@/components/member/EventRsvpSection";
import EventDetailHero from "@/components/member/EventDetailHero";
import { evaluateTierAccess, normalizeTierAudience } from "@/lib/tierAccess";

export const dynamic = "force-dynamic";

function formatTime(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Time to be confirmed";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || "Time to be confirmed";
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
      "id, title, description, event_date, start_time, end_time, venue, image_url, external_rsvp_url, category, capacity, spots_available, status, audience_type, eligible_tiers, show_locked_preview",
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  const eventRecord = event as EventRow;
  const access = evaluateTierAccess(
    {
      membershipTier: currentUser.membershipTier,
      membershipStatus: currentUser.membershipStatus,
      expiryDate: currentUser.expiryDate,
    },
    normalizeTierAudience(eventRecord),
  );

  if (!access.canAccess) {
    notFound();
  }

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
    metadata: {
      title: eventRecord.title,
      category: eventRecord.category || "General",
    },
  });

  const isFull =
    eventRecord.spots_available !== null && eventRecord.spots_available <= 0;
  const isRegistered = registration?.status === "registered";

  const spotsAvailableText =
    eventRecord.spots_available !== null
      ? eventRecord.spots_available > 0
        ? `${eventRecord.spots_available} spot${eventRecord.spots_available === 1 ? "" : "s"} remaining`
        : "Event is currently full"
      : eventRecord.capacity !== null
        ? `${eventRecord.capacity} total seats`
        : "Open RSVP";

  return (
    <MemberPageShell showTopBar={false} showBottomNav={true}>
      <div className="px-4 py-5 font-helvetica pb-8">
        {/* Top Navigation Header */}
        <header className="flex items-center gap-3">
          <Link
            href="/member/events"
            aria-label="Back to events directory"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-white text-neutral-700 shadow-2xs transition-all hover:bg-neutral-50 active:scale-95"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-bold font-sans text-neutral-900 line-clamp-1">
            Event Details
          </h1>
        </header>

        {/* 1. Hero Poster Banner (with fallback) */}
        <div className="mt-4">
          <EventDetailHero
            imageUrl={eventRecord.image_url}
            title={eventRecord.title}
            category={eventRecord.category}
          />
        </div>

        {/* 2. Title & Status Badges */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2">
            {isRegistered ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE5CA] bg-[#E8F4E6] px-3 py-1 text-xs font-bold text-[#0F6E00]">
                ✓ You&apos;re Registered
              </span>
            ) : isFull ? (
              <span className="rounded-full border border-neutral-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                Event Full
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#CDE5CA] bg-[#E8F4E6] px-3 py-1 text-xs font-bold text-[#0F6E00]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0F6E00]" />
                Open for Registration
              </span>
            )}

            {eventRecord.category && (
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
                {eventRecord.category}
              </span>
            )}
          </div>

          <h2 className="mt-3 text-xl sm:text-2xl font-bold font-sans tracking-tight text-neutral-950 leading-tight">
            {eventRecord.title}
          </h2>
        </div>

        {/* 3. Unified Meta Details Card (Merging the 4 isolated cards) */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-xs divide-y divide-neutral-100">
          {/* Row 1: DATE */}
          <div className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F4E6] text-[#0F6E00]">
              <CalendarDays size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Date
              </p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                {formatMemberDate(eventRecord.event_date)}
              </p>
            </div>
          </div>

          {/* Row 2: TIME */}
          <div className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F4E6] text-[#0F6E00]">
              <Clock size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Time
              </p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                {formatTime(eventRecord.start_time, eventRecord.end_time)}
              </p>
            </div>
          </div>

          {/* Row 3: VENUE */}
          <div className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F4E6] text-[#0F6E00]">
              <MapPin size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Venue
              </p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                {eventRecord.venue || "Venue to be confirmed"}
              </p>
            </div>
          </div>

          {/* Row 4: AVAILABILITY */}
          <div className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F4E6] text-[#0F6E00]">
              <Users size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Availability
              </p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">
                {spotsAvailableText}
              </p>
            </div>
          </div>
        </section>

        {/* 4. Description Section */}
        {eventRecord.description && (
          <section className="mt-5 rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              About This Event
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-neutral-700 whitespace-pre-line break-words">
              {eventRecord.description}
            </p>
          </section>
        )}

        {/* 5. RSVP & Registration Action Section */}
        <section className="mt-6">
          <EventRsvpSection
            eventId={eventRecord.id}
            initialRegistration={registration}
            externalRsvpUrl={eventRecord.external_rsvp_url}
            isFull={isFull}
          />
        </section>
      </div>
    </MemberPageShell>
  );
}
