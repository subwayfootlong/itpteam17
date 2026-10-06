"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Gift,
  Megaphone,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  NotificationType,
  SystemNotification,
} from "@/lib/data/system-notifications";
import MemberBottomNav from "@/components/MemberBottomNav";

type Filter = "All" | "Unread" | NotificationType;

const filters: Filter[] = [
  "All",
  "Unread",
  "Benefit",
  "Announcement",
  "Event",
  "System",
];

const typeStyles: Record<
  NotificationType,
  { icon: React.ElementType; circle: string; chip: string }
> = {
  Benefit: {
    icon: Gift,
    circle: "bg-brand-accent-soft text-amber-900",
    chip: "bg-brand-accent-soft text-amber-900",
  },
  Announcement: {
    icon: Megaphone,
    circle: "bg-brand-primary-100 text-brand-primary-800",
    chip: "bg-brand-primary-100 text-brand-primary-900",
  },
  Event: {
    icon: CalendarDays,
    circle: "bg-brand-secondary-soft text-brand-secondary-dark",
    chip: "bg-brand-secondary-soft text-brand-secondary-dark",
  },
  Renewal: {
    icon: Clock,
    circle: "bg-rose-50 text-brand-rose",
    chip: "bg-rose-50 text-brand-rose",
  },
  System: {
    icon: ShieldCheck,
    circle: "bg-neutral-100 text-neutral-700",
    chip: "bg-neutral-100 text-neutral-700",
  },
};

function NotificationHeader({ unreadCount }: { unreadCount: number }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-100 bg-white/90 px-5 py-3.5 backdrop-blur-md">
      <h1 className="text-lg font-bold tracking-tight text-neutral-900">
        Pergas
      </h1>
      <Link
        href="/member/notifications"
        aria-label={`${unreadCount} unread notifications`}
        aria-current="page"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-700"
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-rose" />
        )}
      </Link>
    </header>
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

  return (
    <div>
      {showChrome && <NotificationHeader unreadCount={unreadCount} />}

      <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
        <section className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-butler text-2xl font-semibold leading-tight text-brand-primary-800">
              Notifications
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary-800 px-1.5 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
              {unreadCount === 0 ? "You're all caught up" : "unread updates"}
            </p>
          </div>
        </section>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-primary-800 px-3.5 py-1.5 text-xs font-semibold text-brand-primary-800 transition-transform duration-100 hover:bg-brand-primary-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={14} aria-hidden="true" />
            Mark all read
          </button>
          <button
            type="button"
            onClick={clearRead}
            disabled={readCount === 0}
            className="inline-flex min-h-9 items-center rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition-transform duration-100 hover:border-neutral-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Delete read
          </button>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Search notifications</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary-800"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notifications..."
            className="h-12 w-full rounded-full border border-neutral-300 bg-white pl-11 pr-11 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-brand-primary-700 focus:outline-none focus:ring-4 focus:ring-brand-primary-600/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition-transform duration-100 hover:bg-neutral-200 active:scale-95"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </label>

        <div
          className="no-scrollbar -mx-4 mt-1 flex gap-2 overflow-x-auto px-4 py-3"
          role="group"
          aria-label="Notification filters"
        >
          {filters.map((item) => {
            const isActive = filter === item;

            return (
              <button
                key={item}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-100 active:scale-95 ${
                  isActive
                    ? "bg-brand-primary-800 text-white shadow-sm"
                    : "border border-neutral-300 bg-white text-neutral-700 shadow-xs hover:border-brand-primary-600 hover:text-brand-primary-800"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <section aria-label="Member inbox">
          <div className="mb-2.5 flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Member inbox
            </span>
            <strong className="text-xs font-semibold text-neutral-700">
              {filteredNotifications.length}{" "}
              {filteredNotifications.length === 1 ? "alert" : "alerts"}
            </strong>
          </div>

          {filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const style = typeStyles[notification.type];
                const Icon = style.icon;

                return (
                  <article
                    key={notification.id}
                    className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm ${
                      notification.isRead
                        ? "border-neutral-200 bg-white"
                        : "border-brand-primary-200 bg-brand-primary-50"
                    }`}
                  >
                    {!notification.isRead && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 w-1.5 bg-brand-primary-700"
                      />
                    )}
                    <div className="flex gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.circle}`}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <header className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.chip}`}
                          >
                            {notification.type}
                          </span>
                          <small className="text-[11px] text-neutral-500">
                            {notification.timestamp}
                          </small>
                        </header>
                        <h3 className="mt-1.5 text-sm font-semibold leading-snug text-neutral-950">
                          {notification.title}
                        </h3>
                        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-neutral-600">
                          {notification.message}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-neutral-200/70 pt-2.5">
                          <a
                            href={notification.actionHref}
                            className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-primary-800 transition-transform duration-100 active:scale-95"
                          >
                            {notification.actionLabel}
                            <ChevronRight size={14} aria-hidden="true" />
                          </a>
                          <button
                            type="button"
                            onClick={() => toggleRead(notification.id)}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-neutral-600 transition-transform duration-100 hover:bg-neutral-100 active:scale-95"
                          >
                            <Check size={13} aria-hidden="true" />
                            {notification.isRead ? "Mark unread" : "Mark read"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
                <Bell size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-semibold text-neutral-900">
                No notifications found
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                New benefits, announcements, and event updates will appear here.
              </p>
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast("")}
            className="shrink-0 text-xs font-semibold text-brand-primary-200 active:scale-95"
          >
            Dismiss
          </button>
        </div>
      )}

      {showChrome && <MemberBottomNav />}
    </div>
  );
}
