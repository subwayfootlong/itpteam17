import { logServerError, unexpectedApiError } from "@/lib/serverErrors";
import { readJsonObject, invalidInput, InputValidationError } from "@/lib/inputValidation";
import { NextResponse } from "next/server";
import { requireMember } from "@/lib/currentUser";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications";

const preferenceKeys = ["benefit", "announcement", "event", "email"] as const;

export async function GET() {
  try {
    const { user, response: authResponse } = await requireMember();
    if (authResponse) return authResponse;

    const preferences = await getNotificationPreferences(user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
    return unexpectedApiError("app/api/member/notification-preferences/route.GET", error);
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
      if (!(error instanceof InputValidationError)) logServerError("app/api/member/notification-preferences/route.PATCH", error);
      return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid preference payload" }, { status: 400 });
    }

    const patch: Partial<NotificationPreferences> = {};

    for (const key of preferenceKeys) {
      const value = (body as Record<string, unknown>)[key];
      if (value !== undefined && typeof value !== "boolean") return invalidInput(`${key} must be true or false`);
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
    } catch (caughtError) {
      if (!(caughtError instanceof InputValidationError)) logServerError("app/api/member/notification-preferences/route.PATCH", caughtError);
      const message = "Unable to save preferences";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    return unexpectedApiError("app/api/member/notification-preferences/route.PATCH", error);
  }
}
