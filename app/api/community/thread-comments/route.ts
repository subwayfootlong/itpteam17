import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getErrorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { moderationStatus } from "@/lib/community";
import { formatTierLabel } from "@/lib/membershipTiers";

type CommentRow = {
  id: string;
  parent_comment_id: string | null;
  body: string;
  status: "approved" | "pending" | "flagged";
  created_at: string | null;
  author_name: string | null;
  author_role: string | null;
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    const { threadId, body, parentCommentId } = await req.json();
    const trimmedBody = typeof body === "string" ? body.trim() : "";

    if (typeof threadId !== "string" || !trimmedBody) {
      return NextResponse.json(
        { error: "Missing thread or comment" },
        { status: 400 },
      );
    }

    if (trimmedBody.length > 500) {
      return NextResponse.json(
        { error: "Replies must be 500 characters or fewer." },
        { status: 400 },
      );
    }

    const { data: thread, error: threadError } = await supabaseAdmin
      .from("discussion")
      .select("id, user_id, status")
      .eq("id", threadId)
      .maybeSingle<{ id: string; user_id: string | null; status: string }>();

    if (
      threadError ||
      !thread ||
      (thread.status !== "approved" && thread.user_id !== user.id)
    ) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    let normalizedParentId: string | null = null;
    if (parentCommentId != null) {
      if (typeof parentCommentId !== "string") {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }

      const { data: parentComment, error: parentError } = await supabaseAdmin
        .from("discussion_comments")
        .select("id, thread_id, user_id, status")
        .eq("id", parentCommentId)
        .maybeSingle<{
          id: string;
          thread_id: string;
          user_id: string | null;
          status: string;
        }>();

      if (
        parentError ||
        !parentComment ||
        parentComment.thread_id !== threadId ||
        (parentComment.status !== "approved" && parentComment.user_id !== user.id)
      ) {
        return NextResponse.json(
          { error: "The reply target does not belong to this discussion." },
          { status: 400 },
        );
      }
      normalizedParentId = parentComment.id;
    }

    const { data, error } = await supabaseAdmin
      .from("discussion_comments")
      .insert({
        thread_id: threadId,
        parent_comment_id: normalizedParentId,
        user_id: user.id,
        author_name: user.fullName,
        author_role: `${formatTierLabel(user.membershipTier)} Member`,
        body: trimmedBody,
        status: moderationStatus(trimmedBody),
      })
      .select("id, parent_comment_id, body, status, created_at, author_name, author_role")
      .single<CommentRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      comment: {
        id: data.id,
        parentId: data.parent_comment_id,
        author: data.author_name || user.fullName,
        role: data.author_role || "Active Member",
        body: data.body,
        postedAt: "Just now",
        status: data.status,
        isOwn: true,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(err, "Unable to post comment") },
      { status: 500 },
    );
  }
}
