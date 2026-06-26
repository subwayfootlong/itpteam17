"use client";

import Link from "next/link";
import type { CommunityComment } from "@/lib/data/announcements";
import type {
  DiscussionGroup,
  DiscussionGroupId,
  DiscussionThread,
} from "@/lib/communityTypes";
import MemberIcon from "@/components/member/MemberIcon";
import ThreadCard from "./ThreadCard";

export default function DiscussionFeed({
  groupId,
  groups,
  threads,
  localComments,
  expandedThreadId,
  onExpandThread,
  onComment,
}: {
  groupId: DiscussionGroupId;
  groups: DiscussionGroup[];
  threads: DiscussionThread[];
  localComments: Record<string, CommunityComment[]>;
  expandedThreadId: string | null;
  onExpandThread: (threadId: string) => void;
  onComment: (threadId: string, body: string) => Promise<void>;
}) {
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const visibleThreads = threads.filter((thread) => thread.groupId === groupId);

  return (
    <section className="community-screen discussion-feed">
      <div className="discussion-feed-hero">
        <div>
          <span>{group?.title ?? "Discussion"}</span>
          <h2>Share and learn with the community</h2>
          <p>Start a respectful post from a focused writing page, then track it here after submission.</p>
        </div>
        <Link href={`/member/community/new?groupId=${encodeURIComponent(groupId)}`}>
          New Post
          <MemberIcon name="edit" size={18} />
        </Link>
      </div>

      {visibleThreads.length > 0 ? (
        visibleThreads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            groupTitle={group?.title ?? "Discussion"}
            isExpanded={expandedThreadId === thread.id}
            localComments={localComments[thread.id] ?? []}
            onToggle={() => onExpandThread(thread.id)}
            onComment={onComment}
          />
        ))
      ) : (
        <div className="community-empty-state">
          <MemberIcon name="message" size={30} />
          <h2>No posts yet</h2>
          <p>Be the first member to start a discussion in this space.</p>
          <Link href={`/member/community/new?groupId=${encodeURIComponent(groupId)}`}>
            Create First Post
          </Link>
        </div>
      )}

      <Link
        className="floating-compose"
        href={`/member/community/new?groupId=${encodeURIComponent(groupId)}`}
        aria-label="Compose"
      >
        <MemberIcon name="edit" size={27} />
      </Link>
    </section>
  );
}
