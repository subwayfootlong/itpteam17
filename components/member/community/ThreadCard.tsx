"use client";

import Link from "next/link";
import { Heart, ImageIcon, MessageSquare, Share2 } from "lucide-react";
import type { DiscussionThread } from "@/lib/communityTypes";
import PendingReviewBadge from "./PendingReviewBadge";

export default function ThreadCard({
  thread,
  groupTitle,
}: {
  thread: DiscussionThread;
  groupTitle: string;
}) {
  const comments = thread.comments.filter((comment) => comment.status === "approved");
  const threadHref = `/member/community/${thread.id}`;
  const authorInitials =
    thread.author
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  async function handleShare() {
    const url = `${window.location.origin}${threadHref}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: thread.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Sharing was dismissed or unavailable; nothing to recover.
    }
  }

  return (
    <article className="mb-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-100 text-sm font-semibold text-brand-primary-800"
        >
          {authorInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold text-neutral-900">
              {thread.author}
            </span>
            <span className="rounded border border-brand-primary-200/50 bg-brand-primary-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary-800">
              {thread.authorRole}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-neutral-500">
            {groupTitle} · {thread.postedAt}
          </p>
        </div>
        {thread.status !== "approved" && (
          <PendingReviewBadge
            label={thread.status === "pending" ? "Pending Review" : "Under Review"}
          />
        )}
      </header>

      <Link
        href={threadHref}
        className="mt-2 block transition-transform duration-100 active:scale-[0.99]"
      >
        <h2 className="mt-1 text-base font-semibold text-neutral-950">
          {thread.title}
        </h2>
        <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{thread.body}</p>
      </Link>

      {thread.hasImage && (
        <div
          aria-hidden="true"
          className="mt-2.5 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-neutral-100 bg-neutral-100 text-neutral-300"
        >
          <ImageIcon size={28} />
        </div>
      )}

      <footer className="mt-3 flex items-center gap-6 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
        <span
          className="flex items-center gap-1.5"
          aria-label={`${thread.votes} ${thread.votes === 1 ? "like" : "likes"}`}
        >
          <Heart size={18} aria-hidden="true" />
          {thread.votes}
        </span>
        <Link
          href={threadHref}
          aria-label={`${comments.length} ${comments.length === 1 ? "comment" : "comments"}`}
          className="flex items-center gap-1.5 transition-transform duration-100 hover:text-brand-primary-800 active:scale-90"
        >
          <MessageSquare size={18} aria-hidden="true" />
          {comments.length}
        </Link>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share post"
          className="ml-auto flex items-center gap-1.5 transition-transform duration-100 hover:text-brand-primary-800 active:scale-90"
        >
          <Share2 size={18} aria-hidden="true" />
        </button>
      </footer>
    </article>
  );
}
