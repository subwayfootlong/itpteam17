"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle, MessageSquare, Send } from "lucide-react";
import type { DiscussionGroup } from "@/lib/communityTypes";

type SubmitState = "idle" | "saving" | "done";
const MIN_TITLE_LENGTH = 3;
const MIN_BODY_LENGTH = 5;

const fieldClassName =
  "w-full rounded-xl border border-neutral-200/60 bg-neutral-100 px-3.5 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary-600/20";
const labelClassName =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600";

function CreateHeader({ kicker }: { kicker: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <Link
        href="/member/community?tab=discussions"
        aria-label="Back to community"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-brand-primary-800 transition-transform duration-100 hover:bg-neutral-200 active:scale-95"
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary-800">
          {kicker}
        </span>
        <h1 className="font-butler text-xl font-semibold leading-tight text-neutral-900">
          Create Post
        </h1>
      </div>
    </div>
  );
}

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

      const threadId =
        typeof result.thread?.id === "string" ? result.thread.id : null;

      if (!threadId) {
        throw new Error("The post was saved, but its discussion page could not be opened.");
      }

      setSubmitState("done");
      router.push(`/member/community/${encodeURIComponent(threadId)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your post.");
      setSubmitState("idle");
    }
  };

  if (groups.length === 0) {
    return (
      <div className="px-4 py-5">
        <CreateHeader kicker="Community" />
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold text-neutral-900">
            No discussion spaces yet
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Discussion groups need to be created before members can publish posts.
          </p>
          <Link
            href="/member/community?tab=discussions"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-primary-800 px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
          >
            Back to Community
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <CreateHeader kicker={selectedGroup?.title ?? "Community"} />

      <form
        className="space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary-800">
            Moderated community thread
          </span>
          <h2 className="mt-1 font-butler text-lg font-semibold text-neutral-900">
            Write with care
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Your post will appear in its discussion space after moderator approval.
          </p>
        </div>

        {error && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-brand-rose"
            role="alert"
          >
            {error}
          </div>
        )}

        <label className="block">
          <span className={labelClassName}>Discussion space</span>
          <select
            className={fieldClassName}
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClassName}>Title</span>
          <input
            className={fieldClassName}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            placeholder="Give your post a clear title"
          />
          <small className="mt-1 block text-xs text-neutral-500">
            {title.length}/80
            {title.trim().length < MIN_TITLE_LENGTH
              ? ` - at least ${MIN_TITLE_LENGTH} characters`
              : ""}
          </small>
        </label>

        <label className="block">
          <span className={labelClassName}>Post content</span>
          <textarea
            className={`${fieldClassName} min-h-36 resize-y`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={800}
            placeholder="Share a respectful question, reflection, or discussion point..."
          />
          <small className="mt-1 block text-xs text-neutral-500">
            {body.length}/800
            {body.trim().length < MIN_BODY_LENGTH
              ? ` - at least ${MIN_BODY_LENGTH} characters`
              : ""}
          </small>
        </label>

        <div className="flex items-start gap-2.5 rounded-xl bg-brand-primary-50 p-3 text-xs text-neutral-700">
          <HelpCircle
            size={18}
            className="shrink-0 text-brand-primary-800"
            aria-hidden="true"
          />
          <p>Keep posts constructive. Comments and replies may be reviewed by moderators.</p>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitState === "saving" ? "Submitting..." : "Submit for Review"}
          <Send size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
