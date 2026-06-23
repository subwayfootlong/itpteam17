import MemberPageShell from "@/components/member/MemberPageShell";
import EventsView from "@/components/EventsView";
import { supabaseAdmin } from "@/lib/supabaseServer";

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
};

export default async function EventsPage() {
  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select(
      "id, title, description, event_date, start_time, end_time, venue, image_url, external_rsvp_url, category, capacity, spots_available, status",
    )
    .eq("status", "published")
    .order("event_date", { ascending: true });

  return (
    <MemberPageShell>
      <EventsView
        events={(events || []) as EventRow[]}
        hasError={Boolean(error)}
      />
    </MemberPageShell>
  );
}
