"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  NotificationType,
  SystemNotification,
} from "@/lib/data/system-notifications";
import type { NotificationPreferences } from "@/lib/notifications";
import MemberIcon from "@/components/member/MemberIcon";
import MemberBottomNav from "@/components/MemberBottomNav";

type Filter = "All" | "Unread" | NotificationType;
type PreferenceKey = "benefit" | "announcement" | "event";

const filters: Filter[] = [
  "All",
  "Unread",
  "Benefit",
  "Announcement",
  "Event",
  "System",
];

const preferenceCopy: {
  key: PreferenceKey;
  title: string;
  description: string;
}[] = [
  {
    key: "benefit",
    title: "Benefit updates",
    description: "New and updated member rewards",
  },
  {
    key: "announcement",
    title: "Announcements",
    description: "Official Pergas updates",
  },
  {
    key: "event",
    title: "Event updates",
    description: "Registration windows and event reminders",
  },
];

function NotificationHeader({ unreadCount }: { unreadCount: number }) {
  return (
    <header className="notifications-mobile-header">
      <div>
        <span className="notifications-member-avatar">AK</span>
        <h1>Pergas</h1>
      </div>
      <Link
        className="notifications-bell-button"
        href="/member/notifications"
        aria-label={`${unreadCount} unread notifications`}
        aria-current="page"
      >
        <MemberIcon name="bell" size={22} />
        {unreadCount > 0 && <span />}
      </Link>
    </header>
  );
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const icon =
    type === "Benefit"
      ? "card"
      : type === "Announcement"
        ? "verified"
        : type === "Event"
          ? "calendar"
          : type === "Renewal"
            ? "clock"
            : "shield";

  return (
    <span className={`notifications-type-icon is-${type.toLowerCase()}`}>
      <MemberIcon name={icon} size={20} />
    </span>
  );
}

export default function NotificationsCenter({
  initialNotifications,
  initialPreferences,
  showChrome = true,
}: {
  initialNotifications: SystemNotification[];
  initialPreferences: NotificationPreferences;
  showChrome?: boolean;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(initialPreferences);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const readCount = notifications.length - unreadCount;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("notifications:unread-count", {
        detail: { unreadCount },
      }),
    );
  }, [unreadCount]);

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Unread" && !notification.isRead) ||
        notification.type === filter;
      const matchesQuery =
        !normalizedQuery ||
        [
          notification.title,
          notification.message,
          notification.type,
          notification.priority,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [filter, notifications, query]);

  const markAllRead = async () => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );

    try {
      const response = await fetch("/api/member/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });

      if (!response.ok) {
        throw new Error("Unable to mark notifications as read.");
      }
    } catch (error) {
      setNotifications(previous);
      setToast(error instanceof Error ? error.message : "Action failed.");
    }
  };

  const clearRead = async () => {
    const previous = notifications;
    setNotifications((current) =>
      current.filter((notification) => !notification.isRead),
    );

    try {
      const response = await fetch("/api/member/notifications", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to clear read notifications.");
      }
    } catch (error) {
      setNotifications(previous);
      setToast(error instanceof Error ? error.message : "Action failed.");
    }
  };

  const toggleRead = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);
    if (!notification) return;

    const nextReadState = !notification.isRead;
    const previous = notifications;

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: nextReadState }
          : notification,
      ),
    );

    try {
      const response = await fetch("/api/member/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: nextReadState }),
      });

      if (!response.ok) {
        throw new Error("Unable to update notification.");
      }
    } catch (error) {
      setNotifications(previous);
      setToast(error instanceof Error ? error.message : "Action failed.");
    }
  };

  const togglePreference = async (key: PreferenceKey) => {
    const copy = preferenceCopy.find((item) => item.key === key);
    const previous = preferences;
    const nextValue = !preferences[key];
    const next = { ...preferences, [key]: nextValue };

    setPreferences(next);

    try {
      const response = await fetch("/api/member/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        preferences?: NotificationPreferences;
        error?: string;
      };

      if (!response.ok || !result.preferences) {
        throw new Error(result.error ?? "Unable to save alert preference.");
      }

      setPreferences(result.preferences);
      setToast(
        `${copy?.title ?? "Alert preference"} ${nextValue ? "enabled" : "disabled"}.`,
      );
    } catch (error) {
      setPreferences(previous);
      setToast(error instanceof Error ? error.message : "Action failed.");
    }
  };

  return (
    <div className="notifications-mobile-shell">
      {showChrome && <NotificationHeader unreadCount={unreadCount} />}

      <main className="notifications-mobile-main">
        <section className="notifications-title-row">
          <div>
            <h2>Notifications</h2>
            <p>{unreadCount} unread updates</p>
          </div>
          <div className="notifications-actions-row">
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark All Read
            </button>
            <button type="button" onClick={clearRead} disabled={readCount === 0}>
              Delete Read
            </button>
          </div>
        </section>

        <label className="notifications-search">
          <span className="sr-only">Search notifications</span>
          <MemberIcon name="search" size={22} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notifications..."
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <MemberIcon name="close" size={17} />
            </button>
          )}
        </label>

        <div className="notifications-filter-tabs" aria-label="Notification filters">
          {filters.map((item) => (
            <button
              key={item}
              className={filter === item ? "is-active" : ""}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="notifications-summary-card">
          <div>
            <span>{unreadCount}</span>
            <strong>Unread updates</strong>
          </div>
          <p>New benefits, announcements, and event updates from Pergas admins.</p>
        </section>

        <section className="notifications-preferences-card">
          <div className="notifications-section-heading">
            <span>Push Settings</span>
            <strong>Alert preferences</strong>
          </div>
          <div className="notifications-preference-list">
            {preferenceCopy.map((preference) => (
              <button
                key={preference.key}
                className={preferences[preference.key] ? "is-enabled" : ""}
                type="button"
                onClick={() => togglePreference(preference.key)}
              >
                <span>
                  <strong>{preference.title}</strong>
                  <small>{preference.description}</small>
                </span>
                <i>{preferences[preference.key] ? "On" : "Off"}</i>
              </button>
            ))}
          </div>
        </section>

        <section className="notifications-list-section">
          <div className="notifications-section-heading">
            <span>Member Inbox</span>
            <strong>{filteredNotifications.length} alerts shown</strong>
          </div>

          {filteredNotifications.length > 0 ? (
            <div className="notifications-mobile-list">
              {filteredNotifications.map((notification) => (
                <article
                  className={`notifications-mobile-card ${
                    notification.isRead ? "" : "is-unread"
                  }`}
                  key={notification.id}
                >
                  <NotificationIcon type={notification.type} />
                  <div>
                    <header>
                      <span>{notification.type}</span>
                      <small>{notification.timestamp}</small>
                    </header>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <div className="notifications-card-actions">
                      <a href={notification.actionHref}>
                        {notification.actionLabel}
                        <MemberIcon name="arrow" size={14} />
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleRead(notification.id)}
                      >
                        <MemberIcon name="check" size={14} />
                        {notification.isRead ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="notifications-empty-state">
              <MemberIcon name="bell" size={30} />
              <h3>No notifications found</h3>
              <p>New benefits, announcements, and event updates will appear here.</p>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div className="notifications-mobile-toast" role="status">
          {toast}
          <button type="button" onClick={() => setToast("")}>
            Dismiss
          </button>
        </div>
      )}

      {showChrome && <MemberBottomNav />}
    </div>
  );
}
