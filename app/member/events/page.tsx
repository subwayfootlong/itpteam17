import MemberPageShell from "@/components/member/MemberPageShell";
import EventsView from "@/components/EventsView";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/currentUser";

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
  isRegistered?: boolean;
  isRejected?: boolean;
};

export default async function EventsPage() {
  const currentUser = await getCurrentUser();

  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select(
      "id, title, description, event_date, start_time, end_time, venue, image_url, external_rsvp_url, category, capacity, spots_available, status",
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

  const eventsWithRegStatus = ((events ?? []) as EventRow[]).map((event) => ({
    ...event,
    isRegistered: registeredEventIds.has(event.id),
    isRejected: rejectedEventIds.has(event.id),
  }));

  return (
    <MemberPageShell>
      <EventsView
        events={eventsWithRegStatus as EventRow[]}
        hasError={Boolean(error)}
      />
    </MemberPageShell>
  );
}
