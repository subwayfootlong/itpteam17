"use client";

import { FormEvent, useState } from "react";
import type { CommunityComment } from "@/lib/data/announcements";
import type { DiscussionThread } from "@/lib/communityTypes";
import MemberIcon from "@/components/member/MemberIcon";

export default function ThreadCard({
  thread,
  isExpanded,
  localComments,
  onToggle,
  onComment,
}: {
  thread: DiscussionThread;
  isExpanded: boolean;
  localComments: CommunityComment[];
  onToggle: () => void;
  onComment: (threadId: string, body: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const comments = [...thread.comments, ...localComments];
  const approvedComments = comments.filter(
    (comment) => comment.status === "approved",
  );
  const reviewComments = comments.filter(
    (comment) => comment.status !== "approved",
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    await onComment(thread.id, draft.trim());
    setDraft("");
  };

  return (
    <article className="discussion-thread-card">
      <header>
        <span className="thread-initials">GC</span>
        <div>
          <strong>General Community</strong>
          <small>{thread.postedAt}</small>
        </div>
        <p>{thread.author}</p>
      </header>
      <h2>{thread.title}</h2>
      <p>{thread.body}</p>
      {thread.hasImage && <div className="thread-image-placeholder" />}
      {thread.status !== "approved" && (
        <div className="community-review-note compact">
          <strong>Pending review</strong>
          <p>Your post will appear publicly after moderator approval.</p>
        </div>
      )}
      <footer>
        <span className="vote-pill">
          <MemberIcon name="up" size={22} />
          {thread.votes}
          <MemberIcon name="down" size={22} />
        </span>
        <button type="button" onClick={onToggle}>
          <MemberIcon name="comment" size={22} />
          {comments.length} comments
        </button>
        <button type="button" aria-label="Share thread">
          <MemberIcon name="share" size={21} />
        </button>
      </footer>

      {isExpanded && (
        <div className="thread-comments">
          {approvedComments.map((comment) => (
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
          ))}
          {reviewComments.length > 0 && (
            <div className="community-review-note">
              <strong>Awaiting moderator review</strong>
              {reviewComments.map((comment) => (
                <p key={comment.id}>
                  {comment.status === "flagged"
                    ? "Your comment has been held for moderator review."
                    : "Your comment is pending approval."}
                </p>
              ))}
            </div>
          )}
          <form className="community-composer compact" onSubmit={handleSubmit}>
            <label htmlFor={`thread-comment-${thread.id}`}>
              Add a comment
            </label>
            <textarea
              id={`thread-comment-${thread.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={220}
              placeholder="Join the discussion respectfully..."
            />
            <div>
              <small>{draft.length}/220</small>
              <button type="submit" disabled={!draft.trim()}>
                Submit
                <MemberIcon name="send" size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}
