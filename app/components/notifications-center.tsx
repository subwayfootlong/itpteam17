"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  NotificationType,
  SystemNotification,
} from "../data/system-notifications";

type Filter = "All" | "Unread" | NotificationType;
type PreferenceKey = "renewal" | "event" | "system";

const filters: Filter[] = ["All", "Unread", "Renewal", "Event", "System"];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
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
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 1-15.5 6.3" />
        <path d="M3 12A9 9 0 0 1 18.5 5.7" />
        <path d="M18 2v4h4M6 22v-4H2" />
      </>
    ),
    check: <path d="m20 6-11 11-5-5" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    shield: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
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

function BrandMark() {
  return (
    <div className="brand">
      <Image
        className="brand-logo brand-logo--primary"
        src="/pergas-assets/pergas-logo-primary.png"
        width={250}
        height={50}
        alt="Pergas - Singapore Islamic Scholars and Religious Teachers Association"
        priority
      />
      <Image
        className="brand-logo brand-logo--secondary"
        src="/pergas-assets/pergas-logo-secondary.png"
        width={50}
        height={50}
        alt="Pergas"
        priority
      />
      <span>Member Portal</span>
    </div>
  );
}

function Header({ unreadCount }: { unreadCount: number }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/benefit">Home</Link>
          <a href="#">Events</a>
          <Link href="/benefit">Benefits</Link>
          <Link href="/announcements">Community</Link>
        </nav>
        <div className="member-actions">
          <Link
            className="notification-button is-active"
            href="/notifications"
            aria-label={`${unreadCount} unread notifications`}
            aria-current="page"
          >
            <Icon name="bell" size={21} />
            {unreadCount > 0 && <span />}
          </Link>
          <button className="member-profile">
            <span className="avatar">AK</span>
            <span className="member-copy">
              <strong>Ahmad Khalid</strong>
              <small>Active member</small>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link href="/benefit">
        <Icon name="home" size={21} />
        Home
      </Link>
      <a href="#">
        <Icon name="calendar" size={21} />
        Events
      </a>
      <Link href="/benefit">
        <Icon name="card" size={21} />
        Benefits
      </Link>
      <Link href="/announcements">
        <Icon name="message" size={21} />
        Community
      </Link>
    </nav>
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

export default function NotificationsCenter({
  initialNotifications,
}: {
  initialNotifications: SystemNotification[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("All");
  const [toast, setToast] = useState("");
  const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>({
    renewal: true,
    event: true,
    system: true,
  });

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === "All") return true;
      if (filter === "Unread") return !notification.isRead;
      return notification.type === filter;
    });
  }, [filter, notifications]);

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
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
    <div className="portal-shell notifications-page">
      <Header unreadCount={unreadCount} />
      <main>
        <section className="notifications-hero">
          <Image
            className="hero-floral"
            src="/pergas-assets/pergas-floral.png"
            width={476}
            height={473}
            alt=""
            aria-hidden="true"
          />
          <div className="page-container notifications-hero__content">
            <div>
              <span className="eyebrow">UC-07 NOTIFICATION ENGINE</span>
              <h1>Automated renewal and event alerts</h1>
              <p>
                Receive timely system notifications for membership renewals,
                event reminders and important member updates.
              </p>
            </div>
            <div className="notification-summary-card">
              <Icon name="bell" size={28} />
              <span>{unreadCount}</span>
              <p>
                unread alerts
                <small>{notifications.length} total notifications</small>
              </p>
            </div>
          </div>
        </section>

        <section className="page-container notifications-workspace">
          <aside className="notification-preferences">
            <span className="section-label">PUSH SETTINGS</span>
            <h2>Alert preferences</h2>
            <p>
              Configure which automated alerts the member should receive from
              the Notification Engine.
            </p>

            <div className="preference-list">
              <button
                className={preferences.renewal ? "is-enabled" : ""}
                onClick={() => togglePreference("renewal")}
              >
                <span>
                  <strong>Renewal reminders</strong>
                  <small>Membership expiry and renewal deadlines</small>
                </span>
                <i>{preferences.renewal ? "On" : "Off"}</i>
              </button>
              <button
                className={preferences.event ? "is-enabled" : ""}
                onClick={() => togglePreference("event")}
              >
                <span>
                  <strong>Event updates</strong>
                  <small>Registration windows and event reminders</small>
                </span>
                <i>{preferences.event ? "On" : "Off"}</i>
              </button>
              <button
                className={preferences.system ? "is-enabled" : ""}
                onClick={() => togglePreference("system")}
              >
                <span>
                  <strong>System notices</strong>
                  <small>Comments, account and platform updates</small>
                </span>
                <i>{preferences.system ? "On" : "Off"}</i>
              </button>
            </div>

            <button className="test-alert-button" onClick={sendTestAlert}>
              Send test event alert
              <Icon name="refresh" size={15} />
            </button>

            <div className="engine-note">
              <Icon name="shield" size={17} />
              Prototype note: alerts are simulated locally. In production this
              connects to a backend notification service and browser push
              subscriptions.
            </div>
          </aside>

          <div className="notification-center-panel">
            <div className="notification-toolbar">
              <div>
                <span className="section-label">MEMBER INBOX</span>
                <h2>System notifications</h2>
              </div>
              <button onClick={markAllRead} disabled={unreadCount === 0}>
                Mark all as read
              </button>
            </div>

            <div className="category-tabs notification-tabs">
              {filters.map((item) => (
                <button
                  key={item}
                  className={filter === item ? "is-active" : ""}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="notification-list">
              {filteredNotifications.map((notification) => (
                <article
                  className={`notification-card ${
                    notification.isRead ? "" : "is-unread"
                  }`}
                  key={notification.id}
                >
                  <span
                    className={`notification-icon notification-icon--${notification.type.toLowerCase()}`}
                  >
                    <Icon
                      name={notification.type === "Renewal" ? "clock" : "bell"}
                      size={18}
                    />
                  </span>
                  <div>
                    <div className="notification-card__header">
                      <span>{notification.type}</span>
                      <small>{notification.timestamp}</small>
                    </div>
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <div className="notification-card__actions">
                      <a href={notification.actionHref}>
                        {notification.actionLabel}
                        <Icon name="arrow" size={14} />
                      </a>
                      <button onClick={() => toggleRead(notification.id)}>
                        <Icon name="check" size={14} />
                        {notification.isRead ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {toast && (
        <div className="notification-toast" role="status">
          {toast}
          <button onClick={() => setToast("")}>Dismiss</button>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
