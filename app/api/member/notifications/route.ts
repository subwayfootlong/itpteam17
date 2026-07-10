import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  return NextResponse.json({ unreadCount });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload = body as {
    id?: unknown;
    action?: unknown;
    isRead?: unknown;
  };

  if (payload.action === "mark-all-read") {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (typeof payload.id !== "string" || typeof payload.isRead !== "boolean") {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_deleted: true, is_read: true })
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .eq("is_read", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
