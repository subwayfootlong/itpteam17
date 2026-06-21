import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getErrorMessage } from "@/lib/errors";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { moderationStatus } from "@/lib/community";

type CommentRow = {
  id: string;
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

    const { announcementId, body } = await req.json();
    const trimmedBody = typeof body === "string" ? body.trim() : "";

    if (typeof announcementId !== "string" || !trimmedBody) {
      return NextResponse.json(
        { error: "Missing announcement or comment" },
        { status: 400 },
      );
    }

    if (announcementId.startsWith("admin:")) {
      const adminAnnouncementId = announcementId.replace(/^admin:/, "");
      const { data, error } = await supabaseAdmin
        .from("announcement_comments")
        .insert({
          announcement_id: adminAnnouncementId,
          user_id: user.id,
          author_name: user.fullName,
          author_role: "Active Member",
          content: trimmedBody,
          status: moderationStatus(trimmedBody),
        })
        .select("id, body:content, status, created_at, author_name, author_role")
        .single<CommentRow>();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        comment: {
          id: data.id,
          author: data.author_name || user.fullName,
          role: data.author_role || "Active Member",
          body: data.body,
          postedAt: "Just now",
          status: data.status,
          isOwn: true,
        },
      });
    }

    const { data, error } = await supabaseAdmin
      .from("uc6_announcement_comments")
      .insert({
        announcement_id: announcementId,
        user_id: user.id,
        author_name: user.fullName,
        author_role: "Active Member",
        body: trimmedBody,
        status: moderationStatus(trimmedBody),
      })
      .select("id, body, status, created_at, author_name, author_role")
      .single<CommentRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      comment: {
        id: data.id,
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
