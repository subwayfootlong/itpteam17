import { logServerError, unexpectedApiError } from "@/lib/serverErrors";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { deliverEmailChangeNotification } from "@/lib/emailChangeServer";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const secret = process.env.EMAIL_NOTIFICATION_CRON_SECRET;
    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(req.headers.get("authorization") ?? "");
    if (!secret || secret.length < 32 || received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data, error } = await supabaseAdmin.from("email_change_notifications")
      .select("id").is("sent_at", null).order("created_at").limit(20);
    if (error) {
      logServerError("app/api/internal/email-change-notifications/route.POST", error);
      return NextResponse.json({ error: "Unable to load notifications" }, { status: 503 });
    }
    const results = await Promise.allSettled((data ?? []).map(({ id }) => deliverEmailChangeNotification(id)));
    const failed = results.filter((result) => result.status === "rejected").length;
    return NextResponse.json({ sent: results.length - failed, failed }, { status: failed ? 503 : 200 });
  } catch (error) {
    return unexpectedApiError("app/api/internal/email-change-notifications/route.POST", error);
  }
}
