"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import MemberIcon from "@/components/member/MemberIcon";
import type { CommunityComment } from "@/lib/data/announcements";
import type { DiscussionThread } from "@/lib/communityTypes";
import type { CommentResponse } from "./types";
import { makePendingComment, postJson } from "./utils";

type SortOrder = "oldest" | "newest";

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

function CommentBranch({
  comment,
  childrenByParent,
  depth,
  onReply,
  activeReplyId,
  renderComposer,
}: {
  comment: CommunityComment;
  childrenByParent: Map<string, CommunityComment[]>;
  depth: number;
  onReply: (comment: CommunityComment) => void;
  activeReplyId: string | null;
  renderComposer: (comment: CommunityComment) => React.ReactNode;
}) {
  const replies = childrenByParent.get(comment.id) ?? [];
  const isUnderReview = comment.status !== "approved";

  return (
    <div className="reddit-comment-branch" style={{ "--thread-depth": Math.min(depth, 5) } as React.CSSProperties}>
      <article className={`reddit-comment${isUnderReview ? " is-pending" : ""}`}>
        <div className="reddit-comment-avatar" aria-hidden="true">
          {initials(comment.author)}
        </div>
        <div className="reddit-comment-content">
          <header>
            <strong>{comment.author}</strong>
            <span>{comment.role}</span>
            <small>· {comment.postedAt}</small>
          </header>
          <p>{comment.body}</p>
          <footer>
            {isUnderReview ? (
              <span className="reddit-pending-label">
                <MemberIcon name="clock" size={14} />
                {comment.status === "flagged" ? "Held for review" : "Pending approval"}
              </span>
            ) : (
              <button type="button" onClick={() => onReply(comment)}>
                <MemberIcon name="comment" size={15} />
                Reply
              </button>
            )}
          </footer>
        </div>
      </article>

      {activeReplyId === comment.id && renderComposer(comment)}

      {replies.length > 0 && (
        <div className="reddit-comment-replies">
          {replies.map((reply) => (
            <CommentBranch
              key={reply.id}
              comment={reply}
              childrenByParent={childrenByParent}
              depth={depth + 1}
              onReply={onReply}
              activeReplyId={activeReplyId}
              renderComposer={renderComposer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscussionThreadDetail({
  thread,
  groupTitle,
  memberName,
}: {
  thread: DiscussionThread;
  groupTitle: string;
  memberName: string;
}) {
  const [comments, setComments] = useState(thread.comments);
  const [draft, setDraft] = useState("");
  const [activeReplyTarget, setActiveReplyTarget] = useState<
    CommunityComment | "post" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { roots, childrenByParent } = useMemo(() => {
    const visibleIds = new Set(comments.map((comment) => comment.id));
    const rootComments: CommunityComment[] = [];
    const childMap = new Map<string, CommunityComment[]>();

    for (const comment of comments) {
      if (comment.parentId && visibleIds.has(comment.parentId)) {
        const siblings = childMap.get(comment.parentId) ?? [];
        siblings.push(comment);
        childMap.set(comment.parentId, siblings);
      } else {
        rootComments.push(comment);
      }
    }

    if (sortOrder === "newest") rootComments.reverse();
    return { roots: rootComments, childrenByParent: childMap };
  }, [comments, sortOrder]);

  const approvedCount = comments.filter((comment) => comment.status === "approved").length;

  const selectReply = (comment: CommunityComment) => {
    setActiveReplyTarget(comment);
    setDraft("");
    setError("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const selectPostReply = () => {
    setActiveReplyTarget("post");
    setDraft("");
    setError("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    const replyingTo = activeReplyTarget === "post" ? null : activeReplyTarget;
    let comment = makePendingComment(body, comments.length + 1, memberName);
    comment = { ...comment, parentId: replyingTo?.id ?? null };

    try {
      const response = await postJson<CommentResponse>(
        "/api/community/thread-comments",
        { threadId: thread.id, body, parentCommentId: replyingTo?.id ?? null },
      );
      comment = response.comment;
      setComments((current) => [...current, comment]);
      setDraft("");
      setActiveReplyTarget(null);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your reply.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComposer = (replyingTo: CommunityComment | null) => (
    <form className="thread-reply-editor" onSubmit={handleSubmit}>
      <div className="thread-reply-editor__field">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          aria-label={replyingTo ? `Reply to ${replyingTo.author}` : "Add a comment"}
          placeholder={replyingTo ? `Reply to ${replyingTo.author}` : "Add a comment..."}
        />
      </div>
      {error && <p className="reddit-reply-error" role="alert">{error}</p>}
      <div className="thread-reply-editor__footer">
        <small>
          <span>{draft.length}/500</span>
          Replies require moderator approval.
        </small>
        <div className="thread-reply-editor__actions">
          <button
            className="thread-reply-editor__cancel"
            type="button"
            onClick={() => {
              setActiveReplyTarget(null);
              setDraft("");
              setError("");
            }}
          >
            Cancel
          </button>
          <button className="thread-reply-editor__submit" type="submit" disabled={!draft.trim() || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Comment"}
            {!isSubmitting && <MemberIcon name="send" size={15} />}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="reddit-thread-page">
      <nav className="reddit-thread-back" aria-label="Discussion navigation">
        <Link href={`/member/community?tab=discussions&group=${encodeURIComponent(thread.groupId)}`}>
          <MemberIcon name="back" size={20} />
          Back to {groupTitle}
        </Link>
      </nav>

      <article className="reddit-post">
        <header className="reddit-post-author">
          <span aria-hidden="true">{initials(thread.author)}</span>
          <div>
            <strong>{thread.author}</strong>
            <small>{thread.authorRole} · {thread.postedAt}</small>
          </div>
        </header>
        <div className="reddit-post-group">{groupTitle}</div>
        <h1>{thread.title}</h1>
        <p>{thread.body}</p>
        {thread.hasImage && <div className="thread-image-placeholder" />}
        {thread.status !== "approved" && (
          <div className="community-review-note compact">
            <strong>Pending review</strong>
            <p>Only you can see this post until a moderator approves it.</p>
          </div>
        )}
        <footer className="reddit-post-actions">
          <span><MemberIcon name="comment" size={18} />{approvedCount} {approvedCount === 1 ? "reply" : "replies"}</span>
          <button className="reddit-post-comment-button" type="button" onClick={selectPostReply}>
            <MemberIcon name="comment" size={17} />
            Comment
          </button>
        </footer>
      </article>

      {activeReplyTarget === "post" && renderComposer(null)}

      <section className="reddit-comments" aria-labelledby="discussion-replies-heading">
        <div className="reddit-comments-toolbar">
          <div>
            <span>Discussion</span>
            <h2 id="discussion-replies-heading">{approvedCount} {approvedCount === 1 ? "reply" : "replies"}</h2>
          </div>
          <label>
            <span>Sort by</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
              <option value="oldest">Oldest</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {roots.length > 0 ? (
          <div className="reddit-comment-list">
            {roots.map((comment) => (
              <CommentBranch
                key={comment.id}
                comment={comment}
                childrenByParent={childrenByParent}
                depth={0}
                onReply={selectReply}
                activeReplyId={
                  activeReplyTarget && activeReplyTarget !== "post"
                    ? activeReplyTarget.id
                    : null
                }
                renderComposer={renderComposer}
              />
            ))}
          </div>
        ) : (
          <div className="reddit-comments-empty">
            <MemberIcon name="comment" size={28} />
            <strong>No replies yet</strong>
            <p>Be the first member to continue this discussion.</p>
          </div>
        )}
      </section>
    </div>
  );
}
