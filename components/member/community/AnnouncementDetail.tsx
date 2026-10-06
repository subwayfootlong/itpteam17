"use client";

import { FormEvent, useState } from "react";
import type {
  Announcement,
  CommunityComment,
  PollResponseValue,
} from "@/lib/data/announcements";
import MemberIcon from "@/components/member/MemberIcon";
import { pluralize } from "./utils";

const POLL_OPTIONS: { value: PollResponseValue; label: string }[] = [
  { value: "yes", label: "Yes, I'll attend" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

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
    <section className="community-screen">
      <article className="announcement-detail-card">
        {announcement.imageUrl && (
          <div className="announcement-detail-card__image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={announcement.imageUrl} alt={announcement.title} />
          </div>
        )}
        <p className="official-line">
          <MemberIcon name="verified" size={17} />
          Official Admin <span>{announcement.date}</span>
        </p>
        <h2>{announcement.title}</h2>
        {hasDistinctSummary && (
          <p className="announcement-detail-card__summary">
            {announcement.summary}
          </p>
        )}
        <p className="announcement-detail-card__body-copy">
          {announcement.body}
        </p>

        {announcement.pollEnabled && (
          <div className="announcement-poll">
            <p className="announcement-poll__question">
              {announcement.pollQuestion || "Will you be attending?"}
            </p>
            <div className="announcement-poll__options">
              {POLL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={voting}
                  onClick={() => handleVote(option.value)}
                  className={
                    announcement.myPollResponse === option.value
                      ? "is-selected"
                      : undefined
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
            {pollCounts && pollTotal > 0 && (
              <p className="announcement-poll__tally">
                {pluralize(pollTotal, "response")} · {pollCounts.yes} yes,{" "}
                {pollCounts.maybe} maybe, {pollCounts.no} no
              </p>
            )}
          </div>
        )}
      </article>

      <section className="moderated-comments">
        <div className="moderated-comments__heading">
          <div>
            <span>Moderated thread</span>
            <h3>{pluralize(approvedComments.length, "approved comment")}</h3>
          </div>
          <MemberIcon name="verified" size={20} />
        </div>

        <div className="community-comments-list">
          {approvedComments.length > 0 ? (
            approvedComments.map((comment) => (
              <article className="community-comment" key={comment.id}>
                <span aria-hidden="true">
                  {comment.author
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <strong>{comment.author}</strong>
                  <small>
                    {comment.role} - {comment.postedAt}
                  </small>
                  <p>{comment.body}</p>
                </div>
              </article>
            ))
          ) : (
            <div className="community-empty-comments">
              <strong>No public comments yet</strong>
              <p>Be the first to send a respectful response for review.</p>
            </div>
          )}
        </div>

        {reviewComments.length > 0 && (
          <div className="community-review-note" aria-live="polite">
            <strong>
              {pluralize(reviewComments.length, "comment")} waiting for approval
            </strong>
            <p>
              {reviewComments.some((comment) => comment.status === "flagged")
                ? "One of your comments needs moderator review before it can appear publicly."
                : "Your comment has been saved and will appear here after moderator approval."}
            </p>
          </div>
        )}

        {announcement.commentsEnabled ? (
          <form className="community-composer" onSubmit={handleSubmit}>
            <label htmlFor="announcement-comment">Post a comment</label>
            <textarea
              id="announcement-comment"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={280}
              placeholder="Share a respectful question or response..."
            />
            <div>
              <small>{draft.length}/280</small>
              <button type="submit" disabled={!draft.trim()}>
                Submit
                <MemberIcon name="send" size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="community-review-note">
            <strong>Comments closed</strong>
            <p>This official announcement is read-only.</p>
          </div>
        )}
      </section>
    </section>
  );
}
