import { readJsonObject, invalidInput, InputValidationError, isUuid } from "@/lib/inputValidation";
import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import {
  getModerationTable,
  type ModerationSource,
  type ModerationStatus,
} from "@/lib/commentModeration";

const SOURCES: ModerationSource[] = [
  "admin-announcement",
  "community-announcement",
  "discussion-post",
  "discussion-thread",
];

const ACTION_STATUS: Record<string, ModerationStatus> = {
  approve: "approved",
  reject: "flagged",
};

export async function PATCH(req: Request) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  let body: unknown;

  try {
    body = await readJsonObject(req);
  } catch (error) {
    return invalidInput(error instanceof InputValidationError ? error.message : "Invalid JSON payload");
  }

  const payload = body as {
    id?: unknown;
    source?: unknown;
    action?: unknown;
    currentStatus?: unknown;
  };

  if (!isUuid(payload.id)) {
    return NextResponse.json({ error: "Comment id is required" }, { status: 400 });
  }

  if (
    typeof payload.source !== "string" ||
    !SOURCES.includes(payload.source as ModerationSource)
  ) {
    return NextResponse.json({ error: "Invalid comment source" }, { status: 400 });
  }

  if (
    typeof payload.action !== "string" ||
    !Object.prototype.hasOwnProperty.call(ACTION_STATUS, payload.action)
  ) {
    return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
  }

  if (
    payload.currentStatus !== undefined &&
    (typeof payload.currentStatus !== "string" ||
      !["approved", "pending", "flagged"].includes(payload.currentStatus))
  ) {
    return NextResponse.json({ error: "Invalid current moderation status" }, { status: 400 });
  }

  const status = ACTION_STATUS[payload.action];
  const source = payload.source as ModerationSource;

  const { data, error } = await supabaseUpdateStatus(
    getModerationTable(source),
    payload.id,
    status,
    payload.currentStatus as ModerationStatus | undefined,
  );

  if (error) {
    return NextResponse.json({ error: "Unable to update moderation status" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      {
        error: payload.currentStatus
          ? "This item was changed by another administrator. Refresh and try again."
          : "Moderation item not found",
      },
      { status: payload.currentStatus ? 409 : 404 },
    );
  }

  return NextResponse.json({
    comment: {
      id: data.id,
      status: data.status,
      source,
    },
  });
}

async function supabaseUpdateStatus(
  table: string,
  id: string,
  status: ModerationStatus,
  currentStatus?: ModerationStatus,
) {
  const { supabaseAdmin } = await import("@/lib/supabaseServer");
  let query = supabaseAdmin
    .from(table)
    .update({ status })
    .eq("id", id);

  if (currentStatus) {
    query = query.eq("status", currentStatus);
  }

  const { data, error } = await query
    .select("id, status")
    .maybeSingle<{ id: string; status: ModerationStatus }>();

  return {
    data,
    error: error?.message,
  };
}
