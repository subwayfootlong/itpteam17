"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  NotificationType,
  SystemNotification,
} from "../data/system-notifications";

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

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <path d="m9 18 6-6-6-6" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    check: <path d="m20 6-11 11-5-5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 1-15.5 6.3" />
        <path d="M3 12A9 9 0 0 1 18.5 5.7" />
        <path d="M18 2v4h4M6 22v-4H2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    shield: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

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
        href="/notifications"
        aria-label={`${unreadCount} unread notifications`}
        aria-current="page"
      >
        <Icon name="bell" size={22} />
        {unreadCount > 0 && <span />}
      </Link>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="notifications-bottom-nav" aria-label="Mobile navigation">
      <Link href="/benefit">
        <Icon name="home" size={22} />
        Home
      </Link>
      <a href="#">
        <Icon name="calendar" size={22} />
        Events
      </a>
      <Link href="/benefit">
        <Icon name="card" size={22} />
        Benefits
      </Link>
      <Link href="/announcements">
        <Icon name="message" size={22} />
        Community
      </Link>
      <a className="is-active" href="#" aria-current="page">
        <Icon name="user" size={22} />
        Profile
      </a>
    </nav>
  );
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const icon = type === "Renewal" ? "clock" : type === "System" ? "shield" : "bell";

  return (
    <span className={`notifications-type-icon is-${type.toLowerCase()}`}>
      <Icon name={icon} size={20} />
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
          <Icon name="search" size={22} />
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
              <Icon name="close" size={17} />
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
            <Icon name="refresh" size={15} />
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
                        <Icon name="arrow" size={14} />
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleRead(notification.id)}
                      >
                        <Icon name="check" size={14} />
                        {notification.isRead ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="notifications-empty-state">
              <Icon name="bell" size={30} />
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

      {showChrome && <BottomNav />}
    </div>
  );
}
