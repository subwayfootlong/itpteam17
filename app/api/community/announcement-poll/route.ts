import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getErrorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabaseServer";
import type { PollCounts, PollResponseValue } from "@/lib/data/announcements";

const VALID_RESPONSES: PollResponseValue[] = ["yes", "no", "maybe"];

type PollResponseRow = {
  response: PollResponseValue;
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const { announcementId, response } = await req.json();

    if (typeof announcementId !== "string" || !announcementId.startsWith("admin:")) {
      return NextResponse.json(
        { error: "Polls are only available on official announcements" },
        { status: 400 },
      );
    }
    if (!VALID_RESPONSES.includes(response)) {
      return NextResponse.json({ error: "Invalid response" }, { status: 400 });
    }

    const id = announcementId.replace(/^admin:/, "");

    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from("announcements")
      .select("id, poll_enabled")
      .eq("id", id)
      .maybeSingle<{ id: string; poll_enabled: boolean | null }>();

    if (announcementError) {
      return NextResponse.json({ error: announcementError.message }, { status: 500 });
    }
    if (!announcement || !announcement.poll_enabled) {
      return NextResponse.json({ error: "This announcement has no active poll" }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
      .from("announcement_poll_responses")
      .upsert(
        {
          announcement_id: id,
          user_id: user.id,
          response,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "announcement_id,user_id" },
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const { data: allResponses, error: tallyError } = await supabaseAdmin
      .from("announcement_poll_responses")
      .select("response")
      .eq("announcement_id", id);

    if (tallyError) {
      return NextResponse.json({ error: tallyError.message }, { status: 500 });
    }

    const counts: PollCounts = { yes: 0, no: 0, maybe: 0 };
    for (const row of (allResponses ?? []) as PollResponseRow[]) {
      counts[row.response] += 1;
    }

    return NextResponse.json({ response, counts });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, "Unable to record your response") },
      { status: 500 },
    );
  }
}
