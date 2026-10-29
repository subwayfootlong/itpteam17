import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ACCOUNTS, type AccountRole } from "./accounts";

// Service-role client for TEST SETUP AND CLEANUP ONLY: creating fixture rows,
// reading back the database to confirm a request changed (or did not change)
// something, and deleting what the test created. Never used to make the
// requests under test; those always go through the portal's HTTP API.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

export type TestUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  membership_tier: string;
  membership_status: string | null;
  expiry_date: string | null;
};

export async function userFor(role: AccountRole): Promise<TestUser> {
  const { data, error } = await db()
    .from("users")
    .select("id, email, first_name, last_name, phone, role, membership_tier, membership_status, expiry_date")
    .eq("email", ACCOUNTS[role])
    .single<TestUser>();
  if (error || !data) throw new Error(`Test account ${ACCOUNTS[role]} not found: ${error?.message}`);
  return data;
}

/** Throws if a cleanup/setup query failed, so a broken fixture never looks like a pass. */
export function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what} failed: ${res.error.message}`);
  return res.data;
}

/** Marker put in every fixture row's text, so leftovers from a crashed run are easy to find. */
export const FIXTURE_TAG = "[security-test]";

/** A published event visible to the given tiers (or all), happening 30 days from now. */
export async function createEvent(opts: { title: string; tiers?: string[] }) {
  const date = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const row = must(
    await db()
      .from("events")
      .insert({
        title: `${FIXTURE_TAG} ${opts.title}`,
        description: `${FIXTURE_TAG} created by the security tests and deleted afterwards`,
        event_date: date,
        start_time: "10:00",
        end_time: "11:00",
        venue: "Test venue",
        category: "General",
        capacity: 50,
        spots_available: 50,
        status: "published",
        audience_type: opts.tiers ? "selected_tiers" : "all",
        eligible_tiers: opts.tiers ?? [],
        show_locked_preview: false,
      })
      .select("id")
      .single<{ id: string }>(),
    "create event",
  );
  if (!row) throw new Error("create event returned no row");
  return row.id;
}

export async function deleteEvent(id: string) {
  await db().from("event_registrations").delete().eq("event_id", id);
  await db().from("analytics_events").delete().eq("target_id", id);
  must(await db().from("events").delete().eq("id", id), "delete event");
}
