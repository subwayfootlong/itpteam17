"use client";

import { FormEvent, useState } from "react";
import { Clock, Lock, MessageSquare, Send, ShieldCheck } from "lucide-react";
import type {
  Announcement,
  CommunityComment,
  PollResponseValue,
} from "@/lib/data/announcements";
import { pluralize } from "./utils";

const POLL_OPTIONS: { value: PollResponseValue; label: string }[] = [
  { value: "yes", label: "Yes, I'll attend" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M"
  );
}

export default function AnnouncementDetail({
  announcement,
  localComments,
  onComment,
  onVote,
}: {
  announcement: Announcement;
  localComments: CommunityComment[];
  onComment: (announcementId: string, body: string) => Promise<void>;
  onVote: (announcementId: string, response: PollResponseValue) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [voting, setVoting] = useState(false);
  const comments = [...announcement.comments, ...localComments];
  const approvedComments = comments.filter(
    (comment) => comment.status === "approved",
  );
  const reviewComments = comments.filter(
    (comment) => comment.status !== "approved",
  );
  const hasDistinctSummary =
    announcement.summary.trim().toLowerCase() !==
    announcement.body.trim().toLowerCase();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    await onComment(announcement.id, draft.trim());
    setDraft("");
  };

  const handleVote = async (response: PollResponseValue) => {
    if (voting || announcement.myPollResponse === response) return;
    setVoting(true);
    try {
      await onVote(announcement.id, response);
    } finally {
      setVoting(false);
    }
  };

  const pollCounts = announcement.pollCounts;
  const pollTotal = pollCounts
    ? pollCounts.yes + pollCounts.no + pollCounts.maybe
    : 0;

  return (
    <section className="space-y-4 px-4 pb-28 pt-4">
      <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {announcement.imageUrl && (
          <div className="aspect-video w-full overflow-hidden bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="h-full w-full object-cover object-center"
            />
          </div>
        )}
        <div className="p-4">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-neutral-500">
            <span className="inline-flex items-center gap-1 font-semibold text-brand-primary-800">
              <ShieldCheck size={14} aria-hidden="true" />
              Official Admin
            </span>
            <span aria-hidden="true">·</span>
            <span>{announcement.date}</span>
            <span aria-hidden="true">·</span>
            <span>{announcement.readTime}</span>
          </p>
          <h2 className="mt-2 text-lg font-semibold leading-snug text-neutral-950">
            {announcement.title}
          </h2>
          {hasDistinctSummary && (
            <p className="mt-3 rounded-r-lg border-l-4 border-brand-primary-600 bg-brand-primary-50 px-3 py-2.5 text-sm text-neutral-700">
              {announcement.summary}
            </p>
          )}
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
            {announcement.body}
          </p>

          {announcement.pollEnabled && (
            <div className="mt-4 rounded-xl border border-brand-primary-200 bg-brand-primary-50 p-3.5">
              <p className="text-sm font-semibold text-neutral-900">
                {announcement.pollQuestion || "Will you be attending?"}
              </p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {POLL_OPTIONS.map((option) => {
                  const isSelected = announcement.myPollResponse === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={voting}
                      aria-pressed={isSelected}
                      onClick={() => handleVote(option.value)}
                      className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-semibold transition-all duration-100 active:scale-[0.98] disabled:opacity-60 ${
                        isSelected
                          ? "border-brand-primary-800 bg-brand-primary-800 text-white shadow-sm"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-brand-primary-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {pollCounts && pollTotal > 0 && (
                <p className="mt-2.5 text-[11px] text-neutral-600">
                  {pluralize(pollTotal, "response")} · {pollCounts.yes} yes,{" "}
                  {pollCounts.maybe} maybe, {pollCounts.no} no
                </p>
              )}
            </div>
          )}
        </div>
      </article>

      <section
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
        aria-labelledby="announcement-comments-heading"
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
              <MessageSquare size={16} aria-hidden="true" />
            </span>
            <div>
              <h3
                id="announcement-comments-heading"
                className="text-sm font-semibold text-neutral-950"
              >
                {pluralize(approvedComments.length, "comment")}
              </h3>
              <p className="text-[11px] text-neutral-500">Moderated thread</p>
            </div>
          </div>
        </div>

        {approvedComments.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {approvedComments.map((comment) => (
              <li key={comment.id} className="flex gap-3 px-4 py-3.5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary-100 text-xs font-semibold text-brand-primary-800"
                >
                  {initials(comment.author)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <strong className="text-sm font-semibold text-neutral-900">
                      {comment.author}
                    </strong>
                    <span className="rounded border border-brand-primary-200/50 bg-brand-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary-800">
                      {comment.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {comment.postedAt}
                  </p>
                  <p className="mt-1.5 text-sm text-neutral-700">
                    {comment.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center">
            <strong className="block text-sm font-semibold text-neutral-900">
              No public comments yet
            </strong>
            <p className="mt-1 text-xs text-neutral-500">
              Be the first to send a respectful response for review.
            </p>
          </div>
        )}

        {reviewComments.length > 0 && (
          <div
            className="mx-4 mb-3 flex items-start gap-2 rounded-r-lg border-l-4 border-brand-accent bg-brand-accent-soft p-2.5 text-xs text-amber-900"
            aria-live="polite"
          >
            <Clock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-semibold">
                {pluralize(reviewComments.length, "comment")} waiting for
                approval.
              </strong>{" "}
              {reviewComments.some((comment) => comment.status === "flagged")
                ? "One of your comments needs moderator review before it can appear publicly."
                : "Your comment has been saved and will appear here after moderator approval."}
            </span>
          </div>
        )}

        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          {announcement.commentsEnabled ? (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="announcement-comment"
                className="mb-1.5 block text-xs font-semibold text-neutral-800"
              >
                Post a comment
              </label>
              <textarea
                id="announcement-comment"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={280}
                rows={3}
                placeholder="Share a respectful question or response..."
                className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-500 focus:border-brand-primary-700 focus:outline-none focus:ring-4 focus:ring-brand-primary-600/15"
              />
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <small className="text-[11px] text-neutral-500">
                  {draft.length}/280 · Reviewed before publishing
                </small>
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-brand-primary-800 px-4 py-2 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit
                  <Send size={14} aria-hidden="true" />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-2.5 text-neutral-600">
              <Lock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <strong className="block text-sm font-semibold text-neutral-900">
                  Comments closed
                </strong>
                <p className="text-xs">This official announcement is read-only.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
