"use client";

import Link from "next/link";
import { MessageSquare, PenLine } from "lucide-react";
import type {
  DiscussionGroup,
  DiscussionGroupId,
  DiscussionThread,
} from "@/lib/communityTypes";
import ThreadCard from "./ThreadCard";

export default function DiscussionFeed({
  groupId,
  groups,
  threads,
}: {
  groupId: DiscussionGroupId;
  groups: DiscussionGroup[];
  threads: DiscussionThread[];
}) {
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const visibleThreads = threads.filter((thread) => thread.groupId === groupId);
  const composeHref = `/member/community/new?groupId=${encodeURIComponent(groupId)}`;

  return (
    <section className="px-4 pb-28 pt-4">
      <div className="mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary-800">
          {group?.title ?? "Discussion"}
        </span>
        <h2 className="mt-1 font-butler text-lg font-semibold leading-tight text-neutral-900">
          Share and learn with the community
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Start a respectful post, then track it here after submission.
        </p>
      </div>

      {visibleThreads.length > 0 ? (
        visibleThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            groupTitle={group?.title ?? "Discussion"}
          />
        ))
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold text-neutral-900">
            No posts yet
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Be the first member to start a discussion in this space.
          </p>
          <Link
            href={composeHref}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-primary-800 px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
          >
            Create First Post
          </Link>
        </div>
      )}

      {/* Floating action button, kept inside the 28rem app column on wide screens */}
      <Link
        href={composeHref}
        aria-label="Create post"
        className="fixed bottom-20 right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-40 flex items-center gap-2 rounded-full bg-brand-primary-800 px-4 py-3 font-medium text-white shadow-lg transition-transform duration-100 hover:bg-brand-primary-900 active:scale-95"
      >
        <PenLine size={18} aria-hidden="true" />
        <span className="text-sm">Create Post</span>
      </Link>
    </section>
  );
}
