"use client";

import { FormEvent, useState } from "react";
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
  onPost,
}: {
  groupId: DiscussionGroupId;
  groups: DiscussionGroup[];
  threads: DiscussionThread[];
  localComments: Record<string, CommunityComment[]>;
  expandedThreadId: string | null;
  onExpandThread: (threadId: string) => void;
  onComment: (threadId: string, body: string) => Promise<void>;
  onPost: (groupId: DiscussionGroupId, body: string) => Promise<void>;
}) {
  const [postDraft, setPostDraft] = useState("");
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const visibleThreads = threads.filter((thread) => thread.groupId === groupId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postDraft.trim()) return;
    await onPost(groupId, postDraft.trim());
    setPostDraft("");
  };

  return (
    <section className="community-screen discussion-feed">
      <form className="community-composer" onSubmit={handleSubmit}>
        <span className="community-avatar" aria-hidden="true">
          AK
        </span>
        <label className="sr-only" htmlFor="community-post">
          Share your thoughts with the community
        </label>
        <textarea
          id="community-post"
          value={postDraft}
          onChange={(event) => setPostDraft(event.target.value)}
          placeholder={`Share your thoughts with ${group.title.toLowerCase()}...`}
          maxLength={220}
        />
        <button type="submit" disabled={!postDraft.trim()} aria-label="Post">
          <MemberIcon name={postDraft.trim() ? "send" : "image"} size={23} />
        </button>
      </form>

      {visibleThreads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          isExpanded={expandedThreadId === thread.id}
          localComments={localComments[thread.id] ?? []}
          onToggle={() => onExpandThread(thread.id)}
          onComment={onComment}
        />
      ))}

      <button className="floating-compose" type="button" aria-label="Compose">
        <MemberIcon name="edit" size={27} />
      </button>
    </section>
  );
}
