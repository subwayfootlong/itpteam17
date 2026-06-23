import type { CommunityComment } from "@/lib/data/announcements";

export type CommunityTab = "announcements" | "discussions";

export type CommentResponse = {
  comment: CommunityComment;
};

export type ThreadResponse = {
  thread: import("@/lib/communityTypes").DiscussionThread;
};
