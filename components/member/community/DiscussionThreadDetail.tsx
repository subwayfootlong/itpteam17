"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  ImageIcon,
  MessageSquare,
  Send,
} from "lucide-react";
import type { CommunityComment } from "@/lib/data/announcements";
import type { DiscussionThread } from "@/lib/communityTypes";
import type { CommentResponse } from "./types";
import PendingReviewBadge from "./PendingReviewBadge";
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
    <div>
      <article
        className={`flex gap-2.5 py-2.5 ${isUnderReview ? "opacity-80" : ""}`}
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary-100 text-[10px] font-semibold text-brand-primary-800"
        >
          {initials(comment.author)}
        </span>
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <strong className="text-[13px] font-semibold text-neutral-900">
              {comment.author}
            </strong>
            <span className="rounded border border-brand-primary-200/50 bg-brand-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary-800">
              {comment.role}
            </span>
            <small className="text-[11px] text-neutral-500">
              · {comment.postedAt}
            </small>
          </header>
          <p className="mt-1 text-sm leading-relaxed text-neutral-700">
            {comment.body}
          </p>
          <footer className="mt-1.5">
            {isUnderReview ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-accent-soft px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                <Clock size={12} aria-hidden="true" />
                {comment.status === "flagged" ? "Held for review" : "Pending approval"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="-ml-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-neutral-500 transition-transform duration-100 hover:bg-neutral-100 hover:text-brand-primary-800 active:scale-95"
              >
                <MessageSquare size={14} aria-hidden="true" />
                Reply
              </button>
            )}
          </footer>
        </div>
      </article>

      {activeReplyId === comment.id && renderComposer(comment)}

      {replies.length > 0 && (
        <div
          className={
            depth < 5 ? "ml-3.5 border-l-2 border-neutral-200 pl-3" : ""
          }
        >
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
    <form
      className="my-2 rounded-xl border border-neutral-300 bg-white p-3 shadow-xs"
      onSubmit={handleSubmit}
    >
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        maxLength={500}
        rows={3}
        aria-label={replyingTo ? `Reply to ${replyingTo.author}` : "Add a comment"}
        placeholder={replyingTo ? `Reply to ${replyingTo.author}` : "Add a comment..."}
        className="w-full resize-none bg-transparent text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-brand-rose" role="alert">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
        <small className="text-[11px] text-neutral-500">
          {draft.length}/500 · Replies require approval
        </small>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveReplyTarget(null);
              setDraft("");
              setError("");
            }}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-transform duration-100 hover:bg-neutral-100 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!draft.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-800 px-4 py-1.5 text-xs font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Comment"}
            {!isSubmitting && <Send size={13} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <div className="space-y-3 px-4 pb-28 pt-4">
      <nav aria-label="Discussion navigation">
        <Link
          href={`/member/community?tab=discussions&group=${encodeURIComponent(thread.groupId)}`}
          className="inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-xs font-semibold text-brand-primary-800 transition-transform duration-100 active:scale-95"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {groupTitle}
        </Link>
      </nav>

      <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <header className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-100 text-sm font-semibold text-brand-primary-800"
          >
            {initials(thread.author)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <strong className="text-sm font-semibold text-neutral-900">
                {thread.author}
              </strong>
              <span className="rounded border border-brand-primary-200/50 bg-brand-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary-800">
                {thread.authorRole}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              {groupTitle} · {thread.postedAt}
            </p>
          </div>
          {thread.status !== "approved" && (
            <PendingReviewBadge
              label={thread.status === "pending" ? "Pending Review" : "Under Review"}
            />
          )}
        </header>
        <h1 className="mt-3 text-lg font-semibold leading-snug text-neutral-950">
          {thread.title}
        </h1>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {thread.body}
        </p>
        {thread.hasImage && (
          <div
            aria-hidden="true"
            className="mt-3 flex aspect-video items-center justify-center rounded-xl border border-neutral-100 bg-neutral-100 text-neutral-300"
          >
            <ImageIcon size={28} />
          </div>
        )}
        <footer className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={16} aria-hidden="true" />
            {approvedCount} {approvedCount === 1 ? "reply" : "replies"}
          </span>
          <button
            type="button"
            onClick={selectPostReply}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-800 px-4 py-1.5 text-xs font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-95"
          >
            <MessageSquare size={14} aria-hidden="true" />
            Comment
          </button>
        </footer>
      </article>

      {activeReplyTarget === "post" && renderComposer(null)}

      <section
        className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        aria-labelledby="discussion-replies-heading"
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <h2
            id="discussion-replies-heading"
            className="text-sm font-semibold text-neutral-950"
          >
            {approvedCount} {approvedCount === 1 ? "reply" : "replies"}
          </h2>
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <span>Sort by</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-primary-600/20"
            >
              <option value="oldest">Oldest</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>

        {roots.length > 0 ? (
          <div className="divide-y divide-neutral-100">
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
          <div className="flex flex-col items-center py-8 text-center">
            <MessageSquare
              size={26}
              className="text-neutral-300"
              aria-hidden="true"
            />
            <strong className="mt-2 text-sm font-semibold text-neutral-900">
              No replies yet
            </strong>
            <p className="mt-1 text-xs text-neutral-500">
              Be the first member to continue this discussion.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
