"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  NotificationType,
  SystemNotification,
} from "@/lib/data/system-notifications";
import MemberIcon from "@/components/member/MemberIcon";
import MemberBottomNav from "@/components/MemberBottomNav";

type Filter = "All" | "Unread" | NotificationType;
type PreferenceKey = "renewal" | "event" | "system";

const filters: Filter[] = ["All", "Unread", "Renewal", "Event", "System"];

const preferenceCopy: {
  key: PreferenceKey;
  title: string;
  description: string;
}[] = [
  {
    key: "renewal",
    title: "Renewal reminders",
    description: "Membership expiry and renewal deadlines",
  },
  {
    key: "event",
    title: "Event updates",
    description: "Registration windows and event reminders",
  },
  {
    key: "system",
    title: "System notices",
    description: "Comments, account and platform updates",
  },
];

function nextNotification(id: number): SystemNotification {
  return {
    id,
    type: "Event",
    priority: "Medium",
    title: "Test event reminder received",
    message:
      "This test alert simulates the Notification Engine sending an automated event update to the member.",
    timestamp: "Just now",
    actionLabel: "View event",
    actionHref: "#event",
    isRead: false,
  };
}

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
    type === "Renewal" ? "clock" : type === "System" ? "shield" : "bell";

  return (
    <span className={`notifications-type-icon is-${type.toLowerCase()}`}>
      <MemberIcon name={icon} size={20} />
    </span>
  );
}

export default function NotificationsCenter({
  initialNotifications,
  showChrome = true,
}: {
  initialNotifications: SystemNotification[];
  showChrome?: boolean;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>({
    renewal: true,
    event: true,
    system: true,
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

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

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const clearRead = () => {
    setNotifications((current) =>
      current.filter((notification) => !notification.isRead),
    );
  };

  const toggleRead = (id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: !notification.isRead }
          : notification,
      ),
    );
  };

  const togglePreference = (key: PreferenceKey) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const sendTestAlert = () => {
    if (!preferences.event) {
      setToast("Event alerts are turned off. Enable them to receive updates.");
      return;
    }

    setNotifications((current) => [nextNotification(Date.now()), ...current]);
    setToast("Test event update delivered to your notification inbox.");
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
          <div>
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark All Read
            </button>
            <button type="button" onClick={clearRead}>
              Clear Read
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
            <strong>new unread updates</strong>
          </div>
          <button type="button" onClick={sendTestAlert}>
            Test Alert
            <MemberIcon name="refresh" size={15} />
          </button>
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
              <p>Try another filter or send a test alert.</p>
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
