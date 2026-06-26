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
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const payload = body as {
    id?: unknown;
    source?: unknown;
    action?: unknown;
  };

  if (typeof payload.id !== "string" || payload.id.trim().length === 0) {
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

  const status = ACTION_STATUS[payload.action];
  const source = payload.source as ModerationSource;

  const { data, error } = await supabaseUpdateStatus(
    getModerationTable(source),
    payload.id,
    status,
  );

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Moderation item not found" }, { status: 404 });
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
) {
  const { supabaseAdmin } = await import("@/lib/supabaseServer");
  const { data, error } = await supabaseAdmin
    .from(table)
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle<{ id: string; status: ModerationStatus }>();

  return {
    data,
    error: error?.message,
  };
}
