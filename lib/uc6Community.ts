import { supabaseAdmin } from "./supabaseServer";
import type {
  Announcement,
  AnnouncementCategory,
  CommentStatus,
  CommunityComment,
} from "@/app/data/announcements";

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

type AnnouncementRow = {
  id: string;
  title: string;
  category: AnnouncementCategory;
  published_at: string | null;
  read_time: string | null;
  summary: string;
  body: string;
  pinned: boolean | null;
  comments_enabled: boolean | null;
};

type CommentRow = {
  id: string;
  announcement_id?: string;
  thread_id?: string;
  body: string;
  status: CommentStatus;
  created_at: string | null;
  author_name: string | null;
  author_role: string | null;
};

type GroupRow = {
  id: string;
  title: string;
  icon: string | null;
  tone: "green" | "gold" | null;
};

type ThreadRow = {
  id: string;
  group_id: string;
  title: string;
  body: string;
  votes: number | null;
  status: ThreadStatus;
  has_image: boolean | null;
  created_at: string | null;
  author_name: string | null;
};

export const flaggedWords = ["spam", "scam", "hate", "offensive"];

export function moderationStatus(body: string): ThreadStatus {
  const normalized = body.toLowerCase();
  return flaggedWords.some((word) => normalized.includes(word))
    ? "flagged"
    : "pending";
}

export function formatRelativeDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapComment(row: CommentRow): CommunityComment {
  return {
    id: row.id,
    author: row.author_name || "Pergas Member",
    role: row.author_role || "Active Member",
    body: row.body,
    postedAt: formatRelativeDate(row.created_at),
    status: row.status,
  };
}

function mapAnnouncement(
  row: AnnouncementRow,
  comments: CommunityComment[],
): Announcement {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    date: formatRelativeDate(row.published_at),
    readTime: row.read_time || "2 min read",
    summary: row.summary,
    body: row.body,
    pinned: Boolean(row.pinned),
    commentsEnabled: row.comments_enabled !== false,
    comments,
  };
}

function mapThread(
  row: ThreadRow,
  comments: CommunityComment[],
): DiscussionThread {
  return {
    id: row.id,
    groupId: row.group_id,
    author: row.author_name || "Pergas Member",
    postedAt: formatRelativeDate(row.created_at),
    title: row.title,
    body: row.body,
    votes: row.votes ?? 0,
    comments,
    hasImage: Boolean(row.has_image),
    status: row.status,
  };
}

export async function getCommunityData(): Promise<CommunityData> {
  const [
    announcementsResult,
    announcementCommentsResult,
    groupsResult,
    threadsResult,
    threadCommentsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("uc6_announcements")
      .select("id, title, category, published_at, read_time, summary, body, pinned, comments_enabled")
      .eq("status", "published")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false }),
    supabaseAdmin
      .from("uc6_announcement_comments")
      .select("id, announcement_id, body, status, created_at, author_name, author_role")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("uc6_discussion_groups")
      .select("id, title, icon, tone")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("uc6_discussion_threads")
      .select("id, group_id, title, body, votes, status, has_image, created_at, author_name")
      .in("status", ["approved", "pending", "flagged"])
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("uc6_thread_comments")
      .select("id, thread_id, body, status, created_at, author_name, author_role")
      .order("created_at", { ascending: true }),
  ]);

  const firstError =
    announcementsResult.error ||
    announcementCommentsResult.error ||
    groupsResult.error ||
    threadsResult.error ||
    threadCommentsResult.error;

  if (firstError) {
    throw firstError;
  }

  const announcementCommentsById = new Map<string, CommunityComment[]>();
  for (const row of (announcementCommentsResult.data ?? []) as CommentRow[]) {
    if (!row.announcement_id) continue;
    const comments = announcementCommentsById.get(row.announcement_id) ?? [];
    comments.push(mapComment(row));
    announcementCommentsById.set(row.announcement_id, comments);
  }

  const threadCommentsById = new Map<string, CommunityComment[]>();
  for (const row of (threadCommentsResult.data ?? []) as CommentRow[]) {
    if (!row.thread_id) continue;
    const comments = threadCommentsById.get(row.thread_id) ?? [];
    comments.push(mapComment(row));
    threadCommentsById.set(row.thread_id, comments);
  }

  const threads = ((threadsResult.data ?? []) as ThreadRow[]).map((row) =>
    mapThread(row, threadCommentsById.get(row.id) ?? []),
  );

  const threadCounts = threads.reduce<Record<string, number>>((acc, thread) => {
    acc[thread.groupId] = (acc[thread.groupId] ?? 0) + 1;
    return acc;
  }, {});

  return {
    announcements: ((announcementsResult.data ?? []) as AnnouncementRow[]).map(
      (row) => mapAnnouncement(row, announcementCommentsById.get(row.id) ?? []),
    ),
    groups: ((groupsResult.data ?? []) as GroupRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      posts: threadCounts[row.id] ?? 0,
      icon: row.icon || "message",
      tone: row.tone || "green",
    })),
    threads,
  };
}
