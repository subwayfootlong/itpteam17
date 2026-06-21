import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getErrorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { moderationStatus } from "@/lib/community";

type ThreadRow = {
  id: string;
  group_id: string;
  title: string;
  body: string;
  votes: number | null;
  status: "approved" | "pending" | "flagged";
  has_image: boolean | null;
  created_at: string | null;
  author_name: string | null;
};

function makeTitle(body: string) {
  return body.length > 54 ? `${body.slice(0, 54)}...` : body;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const { groupId, body } = await req.json();
    const trimmedBody = typeof body === "string" ? body.trim() : "";

    if (typeof groupId !== "string" || !trimmedBody) {
      return NextResponse.json(
        { error: "Missing discussion group or post" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("uc6_discussion_threads")
      .insert({
        group_id: groupId,
        user_id: user.id,
        author_name: user.fullName,
        title: makeTitle(trimmedBody),
        body: trimmedBody,
        votes: 0,
        has_image: false,
        status: moderationStatus(trimmedBody),
      })
      .select("id, group_id, title, body, votes, status, has_image, created_at, author_name")
      .single<ThreadRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      thread: {
        id: data.id,
        groupId: data.group_id,
        author: data.author_name || user.fullName,
        postedAt: "Just now",
        title: data.title,
        body: data.body,
        votes: data.votes ?? 0,
        comments: [],
        hasImage: Boolean(data.has_image),
        status: data.status,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, "Unable to create discussion") },
      { status: 500 },
    );
  }
}
