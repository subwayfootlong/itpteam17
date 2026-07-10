import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications";

const preferenceKeys = ["benefit", "announcement", "event"] as const;

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in first" }, { status: 401 });
  }

  const preferences = await getNotificationPreferences(user.id);
  return NextResponse.json({ preferences });
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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid preference payload" }, { status: 400 });
  }

  const patch: Partial<NotificationPreferences> = {};

  for (const key of preferenceKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "boolean") {
      patch[key] = value;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "At least one notification preference is required" },
      { status: 400 },
    );
  }

  try {
    const preferences = await updateNotificationPreferences(user.id, patch);
    return NextResponse.json({ preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save preferences";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
