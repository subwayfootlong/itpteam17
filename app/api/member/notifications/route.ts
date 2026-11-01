import { logServerError, unexpectedApiError } from "@/lib/serverErrors";
import { readJsonObject, invalidInput, InputValidationError, isUuid } from "@/lib/inputValidation";
import { NextResponse } from "next/server";
import { requireMember } from "@/lib/currentUser";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { user, response: authResponse } = await requireMember();
    if (authResponse) return authResponse;

    const unreadCount = await getUnreadNotificationCount(user.id);
    return NextResponse.json({ unreadCount });
  } catch (error) {
    return unexpectedApiError("app/api/member/notifications/route.GET", error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, response: authResponse } = await requireMember();
    if (authResponse) return authResponse;

    let body: unknown;
    try {
      body = await readJsonObject(req);
    } catch (error) {
      if (!(error instanceof InputValidationError)) logServerError("app/api/member/notifications/route.PATCH", error);
      return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
    }

    const payload = body as {
      id?: unknown;
      action?: unknown;
      isRead?: unknown;
    };

    if (payload.action !== undefined && payload.action !== "mark-all-read") return invalidInput("Invalid notification action");
    if (payload.action === "mark-all-read") {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("is_read", false);

      if (error) {
        logServerError("app/api/member/notifications/route.PATCH", error);
        return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (!isUuid(payload.id) || typeof payload.isRead !== "boolean") {
      return NextResponse.json(
        { error: "Notification id and read state are required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: payload.isRead })
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .eq("id", payload.id);

    if (error) {
      logServerError("app/api/member/notifications/route.PATCH", error);
      return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return unexpectedApiError("app/api/member/notifications/route.PATCH", error);
  }
}

export async function DELETE() {
  try {
    const { user, response: authResponse } = await requireMember();
    if (authResponse) return authResponse;

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_deleted: true, is_read: true })
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .eq("is_read", true);

    if (error) {
      logServerError("app/api/member/notifications/route.DELETE", error);
      return NextResponse.json({ error: "Unable to complete request" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return unexpectedApiError("app/api/member/notifications/route.DELETE", error);
  }
}
