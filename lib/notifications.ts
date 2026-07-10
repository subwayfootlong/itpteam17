import type {
  NotificationPriority,
  NotificationType,
  SystemNotification,
} from "@/lib/data/system-notifications";
import { formatRelativeDate } from "./dates";
import { supabaseAdmin } from "./supabaseServer";

type NotificationRow = {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_label: string;
  action_href: string;
  is_read: boolean | null;
  is_deleted: boolean | null;
  created_at: string | null;
};

type UserRow = {
  id: string;
  role: string | null;
};

type ExistingNotificationKey = {
  source_type: string;
  source_id: string;
};

export type NotificationPreferenceKey = "benefit" | "announcement" | "event";

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const defaultNotificationPreferences: NotificationPreferences = {
  benefit: true,
  announcement: true,
  event: true,
};

type NotificationPreferenceRow = {
  user_id?: string;
  benefit_enabled: boolean | null;
  announcement_enabled: boolean | null;
  event_enabled: boolean | null;
};

type NotifyMembersInput = {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  sourceType: string;
  sourceId: string;
};

type NotificationInsert = {
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_label: string;
  action_href: string;
  source_type: string;
  source_id: string;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
};

function mapNotificationPreferences(
  row?: Partial<NotificationPreferenceRow> | null,
): NotificationPreferences {
  return {
    benefit: row?.benefit_enabled ?? defaultNotificationPreferences.benefit,
    announcement:
      row?.announcement_enabled ?? defaultNotificationPreferences.announcement,
    event: row?.event_enabled ?? defaultNotificationPreferences.event,
  };
}

function preferenceKeyForType(
  type: NotificationType,
): NotificationPreferenceKey | null {
  if (type === "Benefit") return "benefit";
  if (type === "Announcement") return "announcement";
  if (type === "Event") return "event";
  return null;
}

function notificationTypeAllowed(
  type: NotificationType,
  preferences: NotificationPreferences,
) {
  const key = preferenceKeyForType(type);
  return key ? preferences[key] : true;
}

export function mapNotification(row: NotificationRow): SystemNotification {
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message,
    timestamp: formatRelativeDate(row.created_at),
    actionLabel: row.action_label,
    actionHref: row.action_href,
    isRead: Boolean(row.is_read),
  };
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("benefit_enabled, announcement_enabled, event_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Unable to load notification preferences:", error.message);
    return defaultNotificationPreferences;
  }

  return mapNotificationPreferences(data as NotificationPreferenceRow | null);
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = await getNotificationPreferences(userId);
  const next = { ...current, ...preferences };
  const update = {
    user_id: userId,
    benefit_enabled: next.benefit,
    announcement_enabled: next.announcement,
    event_enabled: next.event,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .upsert(update, { onConflict: "user_id" })
    .select("benefit_enabled, announcement_enabled, event_enabled")
    .single();

  if (error) {
    throw error;
  }

  return mapNotificationPreferences(data as NotificationPreferenceRow);
}

export async function getMemberNotifications(
  userId: string,
): Promise<SystemNotification[]> {
  await syncMemberContentNotifications(userId);

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select(
      "id, type, priority, title, message, action_label, action_href, is_read, is_deleted, created_at",
    )
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Unable to load notifications:", error.message);
    return [];
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  await syncMemberContentNotifications(userId);

  const { count, error } = await supabaseAdmin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .eq("is_read", false);

  if (error) {
    console.warn("Unable to count unread notifications:", error.message);
    return 0;
  }

  return count ?? 0;
}

async function syncMemberContentNotifications(userId: string) {
  const preferences = await getNotificationPreferences(userId);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("notifications")
    .select("source_type, source_id")
    .eq("user_id", userId);

  if (existingError) {
    console.warn("Unable to sync notifications:", existingError.message);
    return;
  }

  const existingKeys = new Set(
    ((existing ?? []) as ExistingNotificationKey[]).map(
      (item) => `${item.source_type}:${item.source_id}`,
    ),
  );

  const [benefits, announcements, events] = await Promise.all([
    supabaseAdmin
      .from("benefits")
      .select("id, merchant_name, discount_description, created_at")
      .eq("is_active", true),
    supabaseAdmin
      .from("announcements")
      .select("id, title, created_at, updated_at")
      .eq("status", "published"),
    supabaseAdmin
      .from("events")
      .select("id, title, event_date, created_at")
      .eq("status", "published"),
  ]);

  const rows: NotificationInsert[] = [];

  if (preferences.benefit && !benefits.error) {
    for (const benefit of benefits.data ?? []) {
      const id = String(benefit.id);
      if (existingKeys.has(`benefit:${id}`)) continue;

      rows.push({
        user_id: userId,
        type: "Benefit",
        priority: "Medium",
        title: `New benefit: ${benefit.merchant_name ?? "Pergas Partner"}`,
        message:
          benefit.discount_description ??
          "A Pergas member benefit is available.",
        action_label: "View benefit",
        action_href: "/member/benefit",
        source_type: "benefit",
        source_id: id,
        is_read: false,
        is_deleted: false,
        created_at: benefit.created_at ?? new Date().toISOString(),
      });
    }
  }

  if (preferences.announcement && !announcements.error) {
    for (const announcement of announcements.data ?? []) {
      const id = String(announcement.id);
      if (existingKeys.has(`announcement:${id}`)) continue;

      rows.push({
        user_id: userId,
        type: "Announcement",
        priority: "Medium",
        title: "New announcement published",
        message: announcement.title ?? "A new Pergas announcement is available.",
        action_label: "Read announcement",
        action_href: "/member/community?tab=announcements",
        source_type: "announcement",
        source_id: id,
        is_read: false,
        is_deleted: false,
        created_at:
          announcement.updated_at ??
          announcement.created_at ??
          new Date().toISOString(),
      });
    }
  }

  if (preferences.event && !events.error) {
    for (const event of events.data ?? []) {
      const id = String(event.id);
      if (existingKeys.has(`event:${id}`)) continue;

      rows.push({
        user_id: userId,
        type: "Event",
        priority: "Medium",
        title: "New event available",
        message: event.event_date
          ? `${event.title ?? "Pergas event"} is scheduled for ${event.event_date}.`
          : event.title ?? "A new Pergas event is available.",
        action_label: "View events",
        action_href: "/member/events",
        source_type: "event",
        source_id: id,
        is_read: false,
        is_deleted: false,
        created_at: event.created_at ?? new Date().toISOString(),
      });
    }
  }

  if (rows.length === 0) return;

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) {
    console.warn("Unable to insert synced notifications:", error.message);
  }
}

async function getMemberPreferenceMap(memberIds: string[]) {
  const { data, error } = await supabaseAdmin
    .from("notification_preferences")
    .select("user_id, benefit_enabled, announcement_enabled, event_enabled")
    .in("user_id", memberIds);

  if (error) {
    console.warn("Unable to load member notification preferences:", error.message);
    return new Map<string, NotificationPreferences>();
  }

  return new Map(
    ((data ?? []) as NotificationPreferenceRow[])
      .filter((row): row is NotificationPreferenceRow & { user_id: string } =>
        Boolean(row.user_id),
      )
      .map((row) => [row.user_id, mapNotificationPreferences(row)]),
  );
}

export async function notifyMembers(input: NotifyMembersInput) {
  const { data: users, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, role");

  if (userError) {
    throw userError;
  }

  const memberIds = ((users ?? []) as UserRow[])
    .filter((user) => user.role !== "admin")
    .map((user) => user.id);

  if (memberIds.length === 0) return;

  const preferenceMap = await getMemberPreferenceMap(memberIds);
  const now = new Date().toISOString();
  const rows = memberIds
    .filter((userId) =>
      notificationTypeAllowed(
        input.type,
        preferenceMap.get(userId) ?? defaultNotificationPreferences,
      ),
    )
    .map((userId) => ({
      user_id: userId,
      type: input.type,
      priority: input.priority ?? "Medium",
      title: input.title,
      message: input.message,
      action_label: input.actionLabel,
      action_href: input.actionHref,
      source_type: input.sourceType,
      source_id: input.sourceId,
      is_read: false,
      is_deleted: false,
      created_at: now,
    }));

  if (rows.length === 0) return;

  const { error } = await supabaseAdmin
    .from("notifications")
    .upsert(rows, {
      onConflict: "user_id,source_type,source_id",
    });

  if (error) {
    throw error;
  }
}

export async function safeNotifyMembers(input: NotifyMembersInput) {
  try {
    await notifyMembers(input);
    return { ok: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      "Notification creation skipped:",
      message,
    );
    return { ok: false, error: message };
  }
}

export async function notifyBenefitAvailable(input: {
  id: string;
  merchantName: string;
  offer: string;
}) {
  await safeNotifyMembers({
    type: "Benefit",
    priority: "Medium",
    title: `New benefit: ${input.merchantName}`,
    message: input.offer || "A new Pergas member benefit is now available.",
    actionLabel: "View benefit",
    actionHref: "/member/benefit",
    sourceType: "benefit",
    sourceId: input.id,
  });
}

export async function notifyAnnouncementPublished(input: {
  id: string;
  title: string;
}) {
  await safeNotifyMembers({
    type: "Announcement",
    priority: "Medium",
    title: "New announcement published",
    message: input.title,
    actionLabel: "Read announcement",
    actionHref: "/member/community?tab=announcements",
    sourceType: "announcement",
    sourceId: input.id,
  });
}

export async function notifyEventPublished(input: {
  id: string;
  title: string;
  eventDate?: string | null;
}) {
  await safeNotifyMembers({
    type: "Event",
    priority: "Medium",
    title: "New event available",
    message: input.eventDate
      ? `${input.title} is scheduled for ${input.eventDate}.`
      : input.title,
    actionLabel: "View events",
    actionHref: "/member/events",
    sourceType: "event",
    sourceId: input.id,
  });
}
