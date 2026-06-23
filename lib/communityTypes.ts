import type { Announcement, CommunityComment } from "@/lib/data/announcements";

export type DiscussionGroupId = string;
export type ThreadStatus = "approved" | "pending" | "flagged";

export type DiscussionGroup = {
  id: DiscussionGroupId;
  title: string;
  posts: number;
  icon: string;
  tone: "green" | "gold";
};

export type DiscussionThread = {
  id: string;
  groupId: DiscussionGroupId;
  author: string;
  postedAt: string;
  title: string;
  body: string;
  votes: number;
  comments: CommunityComment[];
  hasImage?: boolean;
  status: ThreadStatus;
};

export type CommunityData = {
  announcements: Announcement[];
  groups: DiscussionGroup[];
  threads: DiscussionThread[];
};
