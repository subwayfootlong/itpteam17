import type { CommunityComment } from "@/lib/data/announcements";
import type { DiscussionGroupId, DiscussionThread } from "@/lib/communityTypes";
import { moderationStatus } from "@/lib/communityModeration";
import { postJson } from "@/lib/api";

export { postJson };

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function makePendingComment(
  body: string,
  sequence: number,
  authorName: string,
): CommunityComment {
  const status = moderationStatus(body);
  return {
    id: `local-comment-${Date.now()}-${sequence}`,
    author: authorName,
    role: "Active Member",
    body,
    postedAt: "Just now",
    status: status === "flagged" ? "flagged" : "pending",
    isOwn: true,
  };
}

export function makePendingThread(
  groupId: DiscussionGroupId,
  body: string,
  authorName: string,
): DiscussionThread {
  const status = moderationStatus(body);
  return {
    id: `local-thread-${Date.now()}`,
    groupId,
    author: authorName,
    postedAt: "Just now",
    title: body.length > 54 ? `${body.slice(0, 54)}...` : body,
    body,
    votes: 0,
    status,
    comments: [],
  };
}
