import { InputValidationError, invalidInput, readJsonObject, requirePlainText } from "@/lib/inputValidation";
import { NextResponse } from "next/server";
import { requireMember } from "@/lib/currentUser";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { moderationStatus } from "@/lib/community";
import { formatTierLabel } from "@/lib/membershipTiers";
import { evaluateTierAccess, normalizeTierAudience } from "@/lib/tierAccess";

type ThreadRow = {
  id: string;
  group_id: string;
  user_id: string | null;
  title: string;
  body: string;
  votes: number | null;
  status: "approved" | "pending" | "flagged";
  has_image: boolean | null;
  created_at: string | null;
  author_name: string | null;
  author_role: string | null;
};

function makeTitle(body: string) {
  return body.length > 54 ? `${body.slice(0, 54)}...` : body;
}

function cleanTitle(title: unknown, body: string) {
  const trimmedTitle = typeof title === "string" ? title.trim() : "";
  return trimmedTitle || makeTitle(body);
}

export async function POST(req: Request) {
  try {
    const { user, response: authResponse } = await requireMember();
    if (authResponse) return authResponse;

    const { groupId, title, body } = await readJsonObject(req);
    const trimmedBody = requirePlainText(body, "Post", 800);
    // discussion_groups uses text IDs (for example general and spiritual).
    if (typeof groupId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(groupId)) {
      throw new InputValidationError("Invalid discussion group ID");
    }
    if (title !== undefined) requirePlainText(title, "Title", 80, 0);
    const threadTitle = cleanTitle(title, trimmedBody);

    if (typeof groupId !== "string" || !trimmedBody) {
      return NextResponse.json(
        { error: "Missing discussion group or post" },
        { status: 400 },
      );
    }

    const { data: group, error: groupError } = await supabaseAdmin
      .from("discussion_groups")
      .select("id, audience_type, eligible_tiers, show_locked_preview")
      .eq("id", groupId)
      .maybeSingle();
    const groupAccess = group
      ? evaluateTierAccess(
          {
            membershipTier: user.membershipTier,
            membershipStatus: user.membershipStatus,
            expiryDate: user.expiryDate,
          },
          normalizeTierAudience(group),
        )
      : null;
    if (groupError || !group || !groupAccess?.canAccess) {
      return NextResponse.json({ error: "Discussion group not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("discussion")
      .insert({
        group_id: groupId,
        user_id: user.id,
        author_name: user.fullName,
        author_role: `${formatTierLabel(user.membershipTier)} Member`,
        title: threadTitle,
        body: trimmedBody,
        votes: 0,
        has_image: false,
        status: moderationStatus(trimmedBody),
      })
      .select("id, group_id, user_id, title, body, votes, status, has_image, created_at, author_name, author_role")
      .single<ThreadRow>();

    if (error) {
      return NextResponse.json({ error: "Unable to save community content" }, { status: 500 });
    }

    return NextResponse.json({
      thread: {
        id: data.id,
        groupId: data.group_id,
        author: data.author_name || user.fullName,
        authorRole: data.author_role || "Community Member",
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
    if (err instanceof InputValidationError) return invalidInput(err.message);
    return NextResponse.json(
      { error: "Unable to create discussion" },
      { status: 500 },
    );
  }
}
