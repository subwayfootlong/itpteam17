import { supabaseAdmin } from "./supabaseServer";
import type {
  Announcement,
  AnnouncementCategory,
  CommentStatus,
  CommunityComment,
} from "@/lib/data/announcements";
import type {
  CommunityData,
  DiscussionThread,
  ThreadStatus,
} from "./communityTypes";

import { formatRelativeDate } from "./dates";

export type {
  CommunityData,
  DiscussionGroup,
  DiscussionGroupId,
  DiscussionThread,
  ThreadStatus,
} from "./communityTypes";
export { flaggedWords, moderationStatus } from "./communityModeration";
export { formatRelativeDate } from "./dates";

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

type AdminAnnouncementRow = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
  image_url: string | null;
};

type CommentRow = {
  id: string;
  announcement_id?: string;
  thread_id?: string;
  user_id?: string | null;
  body: string;
  status: CommentStatus;
  created_at: string | null;
  author_name: string | null;
  author_role: string | null;
};

type AdminAnnouncementCommentRow = Omit<CommentRow, "announcement_id"> & {
  announcement_id: string;
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
  user_id: string | null;
  title: string;
  body: string;
  votes: number | null;
  status: ThreadStatus;
  has_image: boolean | null;
  created_at: string | null;
  author_name: string | null;
};

function mapAdminAnnouncementCategory(
  category: string | null,
): AnnouncementCategory {
  const normalized = (category ?? "").toLowerCase();

  if (normalized.includes("admin")) return "Official";
  if (
    normalized.includes("workshop") ||
    normalized.includes("agm") ||
    normalized.includes("event")
  ) {
    return "Events";
  }
  if (normalized.includes("member")) return "Membership";

  return "Community";
}

function summarizeContent(content: string) {
  const firstSentence = content.match(/^.{1,150}?(?:\.|\?|!|$)/)?.[0]?.trim();
  return firstSentence || content.slice(0, 150).trim();
}

function shouldShowComment(row: CommentRow, currentUserId?: string) {
  return row.status === "approved" || Boolean(currentUserId && row.user_id === currentUserId);
}

function mapComment(row: CommentRow, currentUserId?: string): CommunityComment {
  return {
    id: row.id,
    author: row.author_name || "Pergas Member",
    role: row.author_role || "Active Member",
    body: row.body,
    postedAt: formatRelativeDate(row.created_at),
    status: row.status,
    isOwn: Boolean(currentUserId && row.user_id === currentUserId),
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

function mapAdminAnnouncement(
  row: AdminAnnouncementRow,
  comments: CommunityComment[],
): Announcement {
  const body = row.content?.trim() || "Announcement details will be updated soon.";
  const imageUrl = row.image_url?.trim();

  return {
    id: `admin:${row.id}`,
    title: row.title,
    category: mapAdminAnnouncementCategory(row.category),
    date: formatRelativeDate(row.updated_at || row.created_at),
    readTime: `${Math.max(1, Math.ceil(body.split(/\s+/).length / 180))} min read`,
    summary: summarizeContent(body),
    body,
    imageUrl: imageUrl || undefined,
    pinned: false,
    commentsEnabled: true,
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

function shouldShowThread(row: ThreadRow, currentUserId?: string) {
  return row.status === "approved" || Boolean(currentUserId && row.user_id === currentUserId);
}

export async function getCommunityData(
  currentUserId?: string,
): Promise<CommunityData> {
  const [
    adminAnnouncementsResult,
    adminAnnouncementCommentsResult,
    announcementsResult,
    announcementCommentsResult,
    groupsResult,
    threadsResult,
    threadCommentsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("announcements")
      .select("id, title, content, category, created_at, updated_at, image_url")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("announcement_comments")
      .select("id, announcement_id, user_id, body:content, status, created_at, author_name, author_role")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("uc6_announcements")
      .select("id, title, category, published_at, read_time, summary, body, pinned, comments_enabled")
      .eq("status", "published")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false }),
    supabaseAdmin
      .from("uc6_announcement_comments")
      .select("id, announcement_id, user_id, body, status, created_at, author_name, author_role")
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("discussion_groups")
      .select("id, title, icon, tone")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("discussion")
      .select("id, group_id, user_id, title, body, votes, status, has_image, created_at, author_name")
      .in("status", ["approved", "pending", "flagged"])
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("discussion_comments")
      .select("id, thread_id, user_id, body, status, created_at, author_name, author_role")
      .order("created_at", { ascending: true }),
  ]);

  const adminCommentsById = new Map<string, CommunityComment[]>();
  if (!adminAnnouncementCommentsResult.error) {
    for (const row of (adminAnnouncementCommentsResult.data ?? []) as AdminAnnouncementCommentRow[]) {
      if (!row.announcement_id || !shouldShowComment(row, currentUserId)) continue;
      const comments = adminCommentsById.get(row.announcement_id) ?? [];
      comments.push(mapComment(row, currentUserId));
      adminCommentsById.set(row.announcement_id, comments);
    }
  }

  const announcementCommentsById = new Map<string, CommunityComment[]>();
  for (const row of (announcementCommentsResult.data ?? []) as CommentRow[]) {
    if (!row.announcement_id || !shouldShowComment(row, currentUserId)) continue;
    const comments = announcementCommentsById.get(row.announcement_id) ?? [];
    comments.push(mapComment(row, currentUserId));
    announcementCommentsById.set(row.announcement_id, comments);
  }

  const threadCommentsById = new Map<string, CommunityComment[]>();
  for (const row of (threadCommentsResult.data ?? []) as CommentRow[]) {
    if (!row.thread_id || !shouldShowComment(row, currentUserId)) continue;
    const comments = threadCommentsById.get(row.thread_id) ?? [];
    comments.push(mapComment(row, currentUserId));
    threadCommentsById.set(row.thread_id, comments);
  }

  const threads = threadsResult.error
    ? []
    : ((threadsResult.data ?? []) as ThreadRow[])
        .filter((row) => shouldShowThread(row, currentUserId))
        .map((row) =>
          mapThread(row, threadCommentsById.get(row.id) ?? []),
        );

  const threadCounts = threads.reduce<Record<string, number>>((acc, thread) => {
    acc[thread.groupId] = (acc[thread.groupId] ?? 0) + 1;
    return acc;
  }, {});

  const adminAnnouncements = adminAnnouncementsResult.error
    ? []
    : ((adminAnnouncementsResult.data ?? []) as AdminAnnouncementRow[]).map(
        (row) => mapAdminAnnouncement(row, adminCommentsById.get(row.id) ?? []),
      );

  const communityAnnouncements =
    announcementsResult.error || announcementCommentsResult.error
      ? []
      : ((announcementsResult.data ?? []) as AnnouncementRow[]).map((row) =>
          mapAnnouncement(row, announcementCommentsById.get(row.id) ?? []),
        );

  return {
    announcements:
      adminAnnouncements.length > 0 ? adminAnnouncements : communityAnnouncements,
    groups: groupsResult.error
      ? []
      : ((groupsResult.data ?? []) as GroupRow[]).map((row) => ({
          id: row.id,
          title: row.title,
          posts: threadCounts[row.id] ?? 0,
          icon: row.icon || "message",
          tone: row.tone || "green",
        })),
    threads,
  };
}
