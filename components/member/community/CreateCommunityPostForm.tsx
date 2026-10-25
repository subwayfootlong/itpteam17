"use client";

import NavLink from "@/components/ui/NavLink";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  Send,
} from "lucide-react";
import type { DiscussionGroup } from "@/lib/communityTypes";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { startNavigationProgress } from "@/components/ui/NavigationProgress";

type SubmitState = "idle" | "saving" | "done";
const MIN_TITLE_LENGTH = 3;
const MIN_BODY_LENGTH = 5;

const fieldClassName =
  "w-full rounded-xl border border-neutral-200/60 member-dark:border-neutral-700/60 bg-neutral-100 member-dark:bg-neutral-800 px-3.5 py-2.5 text-sm text-neutral-800 member-dark:text-neutral-100 placeholder:text-neutral-500 member-dark:placeholder:text-neutral-400 focus:bg-white member-dark:focus:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-primary-600/20 member-dark:focus:ring-brand-primary-700/20";
const labelClassName =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600 member-dark:text-neutral-300";

function CreateHeader({ kicker }: { kicker: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <NavLink
        href="/member/community?tab=discussions"
        aria-label="Back to community"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 member-dark:bg-neutral-800 text-brand-primary-800 member-dark:text-brand-primary-200 transition-transform duration-100 hover:bg-neutral-200 member-dark:hover:bg-neutral-800 active:scale-95"
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </NavLink>
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary-800 member-dark:text-brand-primary-200">
          {kicker}
        </span>
        <h1 className="font-butler text-xl font-semibold leading-tight text-neutral-900 member-dark:text-neutral-100">
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
  const [submittedThreadId, setSubmittedThreadId] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<"post" | "community" | null>(null);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId),
    [groupId, groups],
  );

  const canSubmit =
    Boolean(groupId) &&
    title.trim().length >= MIN_TITLE_LENGTH &&
    body.trim().length >= MIN_BODY_LENGTH &&
    submitState === "idle";

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
      setSubmittedThreadId(threadId);
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
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 member-dark:border-neutral-700 bg-neutral-50 member-dark:bg-neutral-900 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-100 member-dark:bg-brand-primary-900 text-brand-primary-800 member-dark:text-brand-primary-200">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold text-neutral-900 member-dark:text-neutral-100">
            No discussion spaces yet
          </h2>
          <p className="mt-1 text-sm text-neutral-600 member-dark:text-neutral-300">
            Discussion groups need to be created before members can publish posts.
          </p>
          <NavLink
            href="/member/community?tab=discussions"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-primary-800 px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
          >
            Back to Community
          </NavLink>
        </section>
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <CreateHeader kicker={selectedGroup?.title ?? "Community"} />

      <form
        className="space-y-4 rounded-2xl border border-neutral-200/80 member-dark:border-neutral-700/80 bg-white member-dark:bg-neutral-900 p-5 shadow-xl"
        onSubmit={handleSubmit}
      >
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary-800 member-dark:text-brand-primary-200">
            Moderated community thread
          </span>
          <h2 className="mt-1 font-butler text-lg font-semibold text-neutral-900 member-dark:text-neutral-100">
            Write with care
          </h2>
          <p className="mt-1 text-sm text-neutral-600 member-dark:text-neutral-300">
            New posts are reviewed by the Pergas team (typically within 24 hours) before they appear to everyone.
          </p>
        </div>

        {error && (
          <div
            className="rounded-xl border border-rose-200 member-dark:border-rose-800 bg-rose-50 member-dark:bg-rose-950 p-3 text-sm text-brand-rose member-dark:text-rose-300"
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
          <small className="mt-1 block text-xs text-neutral-500 member-dark:text-neutral-400">
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
          <small className="mt-1 block text-xs text-neutral-500 member-dark:text-neutral-400">
            {body.length}/800
            {body.trim().length < MIN_BODY_LENGTH
              ? ` - at least ${MIN_BODY_LENGTH} characters`
              : ""}
          </small>
        </label>

        <div className="flex items-start gap-2.5 rounded-xl bg-brand-primary-50 member-dark:bg-brand-primary-900 p-3 text-xs text-neutral-700 member-dark:text-neutral-300">
          <HelpCircle
            size={18}
            className="shrink-0 text-brand-primary-800 member-dark:text-brand-primary-200"
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

      {submittedThreadId && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-submitted-title"
            className="w-full max-w-md rounded-t-3xl bg-white member-dark:bg-neutral-900 p-5 shadow-xl sm:rounded-3xl"
          >
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary-100 member-dark:bg-brand-primary-900 text-brand-primary-800 member-dark:text-brand-primary-200">
                <CheckCircle2 size={30} aria-hidden="true" />
              </span>
              <h2
                id="post-submitted-title"
                className="mt-3 font-butler text-xl font-semibold text-neutral-950 member-dark:text-neutral-100"
              >
                Post submitted
              </h2>
              <p className="mt-2 text-sm text-neutral-700 member-dark:text-neutral-300">
                Thank you! In line with community guidelines, new posts are
                reviewed by the Pergas team (typically within 24 hours).
              </p>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-accent/60 bg-brand-accent-soft member-dark:bg-neutral-800 p-3 text-xs text-amber-900 member-dark:text-amber-300">
              <Clock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                You can see your post in your feed marked{" "}
                <strong className="font-semibold">Pending Review</strong>. It
                becomes visible to everyone once it is approved.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                disabled={navigatingTo !== null}
                onClick={() => {
                  setNavigatingTo("post");
                  startNavigationProgress();
                  router.push(
                    `/member/community/${encodeURIComponent(submittedThreadId)}`,
                  );
                }}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98] disabled:opacity-70"
              >
                {navigatingTo === "post" ? (
                  <LoadingSpinner label="Opening your post…" size="sm" light />
                ) : (
                  "View my post"
                )}
              </button>
              <button
                type="button"
                disabled={navigatingTo !== null}
                onClick={() => {
                  setNavigatingTo("community");
                  startNavigationProgress();
                  router.push(
                    `/member/community?tab=discussions&group=${encodeURIComponent(groupId)}`,
                  );
                }}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 member-dark:text-neutral-300 transition-transform duration-100 hover:bg-neutral-100 member-dark:hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70"
              >
                {navigatingTo === "community" ? (
                  <LoadingSpinner label="Going back…" size="sm" />
                ) : (
                  "Back to community"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
