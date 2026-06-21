import { supabaseAdmin } from "./supabaseServer";

export type ModerationStatus = "approved" | "pending" | "flagged";

export type ModerationSource =
  | "admin-announcement"
  | "community-announcement"
  | "discussion-thread";

export type ModerationComment = {
  id: string;
  source: ModerationSource;
  sourceLabel: string;
  status: ModerationStatus;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string | null;
  parentId: string;
  parentTitle: string;
};

type CommentRow = {
  id: string;
  announcement_id?: string | null;
  thread_id?: string | null;
  body: string;
  status: ModerationStatus;
  created_at: string | null;
  author_name: string | null;
  author_role: string | null;
};

type ParentRow = {
  id: string;
  title: string | null;
};

function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter(Boolean) as string[]));
}

async function getTitleMap(table: string, ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id, title")
    .in("id", ids);

  if (error) return new Map<string, string>();

  return new Map(
    ((data ?? []) as ParentRow[]).map((row) => [
      String(row.id),
      row.title || "Untitled",
    ]),
  );
}

function mapRow(
  row: CommentRow,
  source: ModerationSource,
  sourceLabel: string,
  parentId: string,
  parentTitle: string,
): ModerationComment {
  return {
    id: row.id,
    source,
    sourceLabel,
    status: row.status,
    authorName: row.author_name || "Pergas Member",
    authorRole: row.author_role || "Active Member",
    body: row.body,
    createdAt: row.created_at,
    parentId,
    parentTitle,
  };
}

export async function getModerationComments(): Promise<ModerationComment[]> {
  const [adminResult, announcementResult, threadResult] = await Promise.all([
    supabaseAdmin
      .from("announcement_comments")
      .select("id, announcement_id, body:content, status, created_at, author_name, author_role")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("uc6_announcement_comments")
      .select("id, announcement_id, body, status, created_at, author_name, author_role")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("uc6_thread_comments")
      .select("id, thread_id, body, status, created_at, author_name, author_role")
      .order("created_at", { ascending: false }),
  ]);

  const adminRows = adminResult.error
    ? []
    : ((adminResult.data ?? []) as CommentRow[]);
  const announcementRows = announcementResult.error
    ? []
    : ((announcementResult.data ?? []) as CommentRow[]);
  const threadRows = threadResult.error
    ? []
    : ((threadResult.data ?? []) as CommentRow[]);

  const [adminTitleMap, announcementTitleMap, threadTitleMap] =
    await Promise.all([
      getTitleMap(
        "announcements",
        uniqueIds(adminRows.map((row) => row.announcement_id)),
      ),
      getTitleMap(
        "uc6_announcements",
        uniqueIds(announcementRows.map((row) => row.announcement_id)),
      ),
      getTitleMap(
        "uc6_discussion_threads",
        uniqueIds(threadRows.map((row) => row.thread_id)),
      ),
    ]);

  const comments = [
    ...adminRows.map((row) => {
      const parentId = row.announcement_id || "";
      return mapRow(
        row,
        "admin-announcement",
        "Admin announcement",
        parentId,
        adminTitleMap.get(parentId) || "Admin announcement",
      );
    }),
    ...announcementRows.map((row) => {
      const parentId = row.announcement_id || "";
      return mapRow(
        row,
        "community-announcement",
        "Community announcement",
        parentId,
        announcementTitleMap.get(parentId) || "Community announcement",
      );
    }),
    ...threadRows.map((row) => {
      const parentId = row.thread_id || "";
      return mapRow(
        row,
        "discussion-thread",
        "Discussion thread",
        parentId,
        threadTitleMap.get(parentId) || "Discussion thread",
      );
    }),
  ];

  return comments.sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return right - left;
  });
}

export function getModerationTable(source: ModerationSource) {
  if (source === "admin-announcement") return "announcement_comments";
  if (source === "community-announcement") return "uc6_announcement_comments";
  return "uc6_thread_comments";
}
