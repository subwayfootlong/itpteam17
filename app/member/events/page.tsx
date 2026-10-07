import MemberPageShell from "@/components/member/MemberPageShell";
import EventsView from "@/components/EventsView";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/currentUser";
import { evaluateTierAccess, normalizeTierAudience } from "@/lib/tierAccess";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  image_url: string | null;
  external_rsvp_url: string | null;
  category: string | null;
  capacity: number | null;
  spots_available: number | null;
  status: string | null;
  audience_type: string | null;
  eligible_tiers: string[] | null;
  show_locked_preview: boolean | null;
  isRegistered?: boolean;
  isRejected?: boolean;
  isLocked?: boolean;
  requiredTierLabels?: string[];
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { view } = await searchParams;
  const initialView = view === "calendar" ? "calendar" : "list";
  const currentUser = await getCurrentUser();

  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select(
      "id, title, description, event_date, start_time, end_time, venue, image_url, external_rsvp_url, category, capacity, spots_available, status, audience_type, eligible_tiers, show_locked_preview",
    )
    .eq("status", "published")
    .order("event_date", { ascending: true });

  const { data: userRegs } = currentUser
    ? await supabaseAdmin
        .from("event_registrations")
        .select("event_id, status")
        .eq("user_id", currentUser.id)
    : { data: [] };

  const registeredEventIds = new Set(
    (userRegs ?? [])
      .filter((r) => r.status === "registered")
      .map((r) => r.event_id)
  );
  const rejectedEventIds = new Set(
    (userRegs ?? [])
      .filter((r) => r.status === "rejected")
      .map((r) => r.event_id)
  );

  const memberAccess = {
    membershipTier: currentUser?.membershipTier,
    membershipStatus: currentUser?.membershipStatus,
    expiryDate: currentUser?.expiryDate,
  };
  const eventsWithRegStatus = ((events ?? []) as EventRow[])
    .map((event) => ({
      event,
      access: evaluateTierAccess(memberAccess, normalizeTierAudience(event)),
    }))
    .filter(({ access }) => access.canAccess || access.canPreview)
    .map(({ event, access }) => ({
      ...event,
      description: access.canAccess
        ? event.description
        : `Available to ${access.requiredTierLabels.join(" and ")} members.`,
      external_rsvp_url: access.canAccess ? event.external_rsvp_url : null,
      isRegistered: access.canAccess && registeredEventIds.has(event.id),
      isRejected: access.canAccess && rejectedEventIds.has(event.id),
      isLocked: !access.canAccess,
      requiredTierLabels: access.requiredTierLabels,
    }));

  return (
    <MemberPageShell>
      <EventsView
        events={eventsWithRegStatus as EventRow[]}
        hasError={Boolean(error)}
        initialView={initialView}
      />
    </MemberPageShell>
  );
}
