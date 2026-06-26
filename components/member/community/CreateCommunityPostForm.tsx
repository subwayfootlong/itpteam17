"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MemberIcon from "@/components/member/MemberIcon";
import type { DiscussionGroup } from "@/lib/communityTypes";

type SubmitState = "idle" | "saving" | "done";
const MIN_TITLE_LENGTH = 3;
const MIN_BODY_LENGTH = 5;

export default function CreateCommunityPostForm({
  groups,
  initialGroupId,
}: {
  groups: DiscussionGroup[];
  initialGroupId?: string | null;
}) {
  const router = useRouter();
  const defaultGroupId = initialGroupId || groups[0]?.id || "";
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId),
    [groupId, groups],
  );

  const canSubmit =
    Boolean(groupId) &&
    title.trim().length >= MIN_TITLE_LENGTH &&
    body.trim().length >= MIN_BODY_LENGTH &&
    submitState !== "saving";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitState("saving");
    setError("");

    try {
      const response = await fetch("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Unable to create your post.",
        );
      }

      setSubmitState("done");
      router.push(`/member/community?tab=discussions&group=${encodeURIComponent(groupId)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your post.");
      setSubmitState("idle");
    }
  };

  if (groups.length === 0) {
    return (
      <div className="community-create-shell">
        <div className="community-create-header">
          <Link href="/member/community?tab=discussions" aria-label="Back to community">
            <MemberIcon name="back" size={22} />
          </Link>
          <div>
            <span>Community</span>
            <h1>Create Post</h1>
          </div>
        </div>
        <section className="community-empty-state community-create-empty">
          <MemberIcon name="message" size={30} />
          <h2>No discussion spaces yet</h2>
          <p>Discussion groups need to be created before members can publish posts.</p>
          <Link href="/member/community?tab=discussions">Back to Community</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="community-create-shell">
      <div className="community-create-header">
        <Link href="/member/community?tab=discussions" aria-label="Back to community">
          <MemberIcon name="back" size={22} />
        </Link>
        <div>
          <span>{selectedGroup?.title ?? "Community"}</span>
          <h1>Create Post</h1>
        </div>
      </div>

      <form className="community-create-card" onSubmit={handleSubmit}>
        <div className="community-create-card__intro">
          <span>Moderated community thread</span>
          <h2>Write with care</h2>
          <p>Your post will appear in its discussion space after moderator approval.</p>
        </div>

        {error && (
          <div className="community-create-error" role="alert">
            {error}
          </div>
        )}

        <label>
          <span>Discussion space</span>
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            placeholder="Give your post a clear title"
          />
          <small>
            {title.length}/80
            {title.trim().length < MIN_TITLE_LENGTH
              ? ` - at least ${MIN_TITLE_LENGTH} characters`
              : ""}
          </small>
        </label>

        <label>
          <span>Post content</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={800}
            placeholder="Share a respectful question, reflection, or discussion point..."
          />
          <small>
            {body.length}/800
            {body.trim().length < MIN_BODY_LENGTH
              ? ` - at least ${MIN_BODY_LENGTH} characters`
              : ""}
          </small>
        </label>

        <div className="community-create-guidance">
          <MemberIcon name="help" size={20} />
          <p>Keep posts constructive. Comments and replies may be reviewed by moderators.</p>
        </div>

        <button type="submit" disabled={!canSubmit}>
          {submitState === "saving" ? "Submitting..." : "Submit for Review"}
          <MemberIcon name="send" size={17} />
        </button>
      </form>
    </div>
  );
}
