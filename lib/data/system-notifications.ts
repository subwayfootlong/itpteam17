export type NotificationType =
  | "Benefit"
  | "Announcement"
  | "Event"
  | "Renewal"
  | "System";
export type NotificationPriority = "High" | "Medium" | "Low";

export type SystemNotification = {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  actionLabel: string;
  actionHref: string;
  isRead: boolean;
};

export const systemNotifications: SystemNotification[] = [
  {
    id: "seed-renewal",
    type: "Renewal",
    priority: "High",
    title: "Membership renewal due in 14 days",
    message:
      "Your membership is approaching its renewal date. Renew early to keep your digital card and member benefits active.",
    timestamp: "Today, 9:00 AM",
    actionLabel: "View renewal",
    actionHref: "#renewal",
    isRead: false,
  },
  {
    id: "seed-event-reminder",
    type: "Event",
    priority: "Medium",
    title: "Community learning circle starts tomorrow",
    message:
      "You have an upcoming event registration. Please check the event details and arrive 10 minutes before the session.",
    timestamp: "Yesterday, 5:30 PM",
    actionLabel: "View event",
    actionHref: "#event",
    isRead: false,
  },
  {
    id: "seed-event-window",
    type: "Event",
    priority: "Low",
    title: "New event registration window opened",
    message:
      "Priority registration is now open for active members. Seats are limited and subject to availability.",
    timestamp: "16 Jun 2026",
    actionLabel: "Browse events",
    actionHref: "#events",
    isRead: true,
  },
  {
    id: "seed-system-comment",
    type: "System",
    priority: "Low",
    title: "Comment submitted for moderator review",
    message:
      "Your community comment has been received and will appear after moderator approval.",
    timestamp: "15 Jun 2026",
    actionLabel: "View community",
    actionHref: "/announcements",
    isRead: true,
  },
];
