"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  LockKeyhole,
  MapPin,
  Users,
} from "lucide-react";
import type { EventRow } from "@/app/member/events/page";
import { formatMemberDate } from "@/lib/dates";

type EventsViewProps = {
  events: EventRow[];
  hasError: boolean;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateKey() {
  return toDateKey(new Date());
}

function getMonthTitle(date: Date) {
  return date.toLocaleDateString("en-SG", {
    month: "long",
    year: "numeric",
  });
}

function getDateLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-SG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Time TBC";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || "Time TBC";
}

function EventPosterBanner({
  imageUrl,
  title,
  category,
}: {
  imageUrl?: string | null;
  title: string;
  category?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageUrl || imageFailed) {
    return (
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#173F14] via-[#245F1B] to-[#0F6E00] flex flex-col items-center justify-center p-6 text-white select-none">
        {/* Subtle decorative glowing shapes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-[#3FAE2A]/20 blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/25"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner backdrop-blur-md">
            <CalendarDays size={24} className="text-white" />
          </div>
          <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#BCE6B2]">
            Pergas Event
          </span>
        </div>

        {category && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-white/30 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F6E00] shadow-xs backdrop-blur-md">
            {category}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950 flex items-center justify-center">
      {/* 1. Ambient blurred backdrop of the flyer to fill card proportions seamlessly */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center scale-110 blur-md opacity-40"
      />

      {/* 2. Full uncropped flyer — preserves faces, heads, asatizah portraits and typography */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title}
        onError={() => setImageFailed(true)}
        className="relative z-10 h-full w-full object-contain object-center drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />

      {category && (
        <span className="absolute left-3 top-3 z-20 rounded-full border border-white/40 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F6E00] shadow-xs backdrop-blur-md">
          {category}
        </span>
      )}
    </div>
  );
}

function EventDescription({
  description,
  eventId,
  isLocked = false,
}: {
  description: string;
  eventId: string;
  isLocked?: boolean;
}) {
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = descriptionRef.current;
    if (!element) return;

    const updateTruncation = () => {
      setIsTruncated(element.scrollHeight > element.clientHeight + 1);
    };

    updateTruncation();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);

    return () => observer.disconnect();
  }, [description]);

  return (
    <div className="mt-2">
      <p
        ref={descriptionRef}
        className="line-clamp-2 break-words text-xs leading-relaxed text-neutral-600"
      >
        {description}
      </p>
      {isTruncated && !isLocked && (
        <Link
          href={`/member/events/${eventId}`}
          className="mt-1 inline-block text-xs font-semibold text-[#0F6E00] hover:underline"
        >
          See more
        </Link>
      )}
    </div>
  );
}

function EventCard({
  event,
  onRegister,
  isRegistering,
}: {
  event: EventRow;
  onRegister: (id: string) => void;
  isRegistering: boolean;
}) {
  const isFull = event.spots_available !== null && event.spots_available <= 0;
  const hasRsvpLink = Boolean(event.external_rsvp_url?.trim());

  return (
    <article className="group mb-4 flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm">
      {/* 16:9 Banner */}
      <div className="relative">
        {event.isLocked ? (
          <EventPosterBanner
            imageUrl={event.image_url}
            title={event.title}
            category={event.category}
          />
        ) : (
          <Link
            href={`/member/events/${event.id}`}
            aria-label={`View details for ${event.title}`}
            className="block"
          >
            <EventPosterBanner
              imageUrl={event.image_url}
              title={event.title}
              category={event.category}
            />
          </Link>
        )}

        {/* Floating status pill on top right */}
        <div className="absolute right-3 top-3 z-10">
          {event.isRegistered ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#CDE5CA] bg-[#E8F4E6]/95 px-2.5 py-0.5 text-[11px] font-bold text-[#0F6E00] shadow-xs backdrop-blur-md">
              <Check size={12} strokeWidth={3} />
              Registered
            </span>
          ) : event.isRejected ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50/95 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 shadow-xs backdrop-blur-md">
              Rejected
            </span>
          ) : event.isLocked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/95 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 shadow-xs backdrop-blur-md">
              <LockKeyhole size={11} />
              Locked
            </span>
          ) : isFull ? (
            <span className="rounded-full bg-neutral-900/85 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-md" style={{ color: "#ffffff" }}>
              Full
            </span>
          ) : null}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Schedule Row */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F6E00]">
            <CalendarDays size={14} className="shrink-0" />
            <span>
              {formatMemberDate(event.event_date)} •{" "}
              {formatTime(event.start_time, event.end_time)}
            </span>
          </div>

          {/* Event Title */}
          <h3 className="mt-2 line-clamp-2 text-base font-bold font-sans leading-snug text-neutral-900 group-hover:text-[#0F6E00] transition-colors">
            {event.isLocked ? (
              event.title
            ) : (
              <Link href={`/member/events/${event.id}`}>{event.title}</Link>
            )}
          </h3>

          {/* Venue & Capacity Row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="shrink-0 text-neutral-400" />
              <span className="truncate">
                {event.venue || "Venue to be confirmed"}
              </span>
            </span>

            {event.spots_available !== null && (
              <span className="flex items-center gap-1 text-neutral-500">
                <Users size={12} className="shrink-0 text-neutral-400" />
                <span>
                  {event.spots_available > 0
                    ? `${event.spots_available} spots left`
                    : "Full"}
                </span>
              </span>
            )}
          </div>

          {/* Description Preview */}
          {event.description ? (
            <EventDescription
              description={event.description}
              eventId={event.id}
              isLocked={event.isLocked}
            />
          ) : null}
        </div>

        {/* Action Button Section with Guaranteed High-Contrast White Text */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          {event.isLocked ? (
            <button
              type="button"
              disabled
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800"
            >
              <LockKeyhole size={14} />
              <span>
                {event.requiredTierLabels?.length
                  ? `${event.requiredTierLabels.join(" / ")} members only`
                  : "Active membership required"}
              </span>
            </button>
          ) : event.isRegistered ? (
            <Link
              href={`/member/events/${event.id}`}
              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#CDE5CA] bg-[#E8F4E6] px-4 py-2.5 text-xs font-bold text-[#0F6E00] transition-all hover:bg-[#d9edd6] active:scale-[0.99]"
            >
              <Check size={14} strokeWidth={3} />
              <span>You&apos;re Registered • View Details</span>
            </Link>
          ) : event.isRejected ? (
            <button
              type="button"
              disabled={isRegistering}
              onClick={() => onRegister(event.id)}
              className="min-h-11 w-full rounded-xl bg-[#0F6E00] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#173F14] active:scale-[0.99] disabled:opacity-50"
              style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
            >
              <span className="text-white font-bold" style={{ color: "#ffffff" }}>
                {isRegistering ? "Processing..." : "Reapply for Event"}
              </span>
            </button>
          ) : isFull ? (
            <div className="flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-stone-100 px-4 py-2.5 text-xs font-semibold text-neutral-500">
              Event is Full
            </div>
          ) : hasRsvpLink ? (
            <a
              href={event.external_rsvp_url!.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0F6E00] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#173F14] active:scale-[0.99]"
              style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
            >
              <span className="text-white font-bold" style={{ color: "#ffffff" }}>
                Register (External) ↗
              </span>
            </a>
          ) : (
            <Link
              href={`/member/events/${event.id}`}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0F6E00] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-[#173F14] active:scale-[0.99]"
              style={{ backgroundColor: "#0F6E00", color: "#ffffff" }}
            >
              <span className="text-white font-bold" style={{ color: "#ffffff" }}>
                View Details & RSVP
              </span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function buildCalendarDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const previousMonthLastDate = new Date(year, month, 0).getDate();

  const days: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const day = previousMonthLastDate - i;
    const date = new Date(year, month - 1, day);

    days.push({ day, dateKey: toDateKey(date), isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({ day, dateKey: toDateKey(date), isCurrentMonth: true });
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - (startDay + daysInMonth) + 1;
    const date = new Date(year, month + 1, nextDay);

    days.push({ day: nextDay, dateKey: toDateKey(date), isCurrentMonth: false });
  }

  return days;
}

export default function EventsView({ events, hasError }: EventsViewProps) {
  const today = new Date();
  const todayKey = getTodayDateKey();
  const router = useRouter();
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  // 1. View Mode Switcher: Default to "list"
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // 2. Filter Pills
  const [selectedFilter, setSelectedFilter] = useState<string>("upcoming");

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const handleInAppRegister = async (eventId: string) => {
    setRegisteringId(eventId);
    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to register");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setRegisteringId(null);
    }
  };

  const calendarDays = useMemo(
    () => buildCalendarDays(currentMonth),
    [currentMonth]
  );

  const eventDates = useMemo(
    () =>
      new Set(
        events
          .filter((event) => event.event_date)
          .map((event) => event.event_date as string)
      ),
    [events]
  );

  const selectedDateEvents = useMemo(
    () => events.filter((event) => event.event_date === selectedDate),
    [events, selectedDate]
  );

  // Extract unique categories for filter pills
  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const e of events) {
      if (e.category?.trim()) {
        unique.add(e.category.trim());
      }
    }
    return Array.from(unique);
  }, [events]);

  // Filtered events for List View
  const listEvents = useMemo(() => {
    return events.filter((event) => {
      if (selectedFilter === "all") return true;
      if (selectedFilter === "upcoming") {
        return event.event_date ? event.event_date >= todayKey : true;
      }
      if (selectedFilter === "registered") {
        return Boolean(event.isRegistered);
      }
      return (
        event.category?.toLowerCase() === selectedFilter.toLowerCase()
      );
    });
  }, [events, selectedFilter, todayKey]);

  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  return (
    <div className="space-y-4 px-4 py-5 font-helvetica">
      {/* 1. View Mode Switcher Toggle (List View vs Calendar) */}
      <div className="flex rounded-2xl bg-stone-100 p-1 shadow-inner border border-stone-200/50">
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
            viewMode === "list"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <List size={16} strokeWidth={2.5} />
          <span>List View</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("calendar")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
            viewMode === "calendar"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <CalendarDays size={16} strokeWidth={2.5} />
          <span>Calendar</span>
        </button>
      </div>

      {/* 2. Category & Filter Pill Rail (Visible ONLY in List View) */}
      {viewMode === "list" && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedFilter("upcoming")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              selectedFilter === "upcoming"
                ? "bg-[#0F6E00] text-white shadow-xs"
                : "border border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300"
            }`}
            style={
              selectedFilter === "upcoming"
                ? { backgroundColor: "#0F6E00", color: "#ffffff" }
                : undefined
            }
          >
            Upcoming
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              selectedFilter === "all"
                ? "bg-[#0F6E00] text-white shadow-xs"
                : "border border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300"
            }`}
            style={
              selectedFilter === "all"
                ? { backgroundColor: "#0F6E00", color: "#ffffff" }
                : undefined
            }
          >
            All Events
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("registered")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
              selectedFilter === "registered"
                ? "bg-[#0F6E00] text-white shadow-xs"
                : "border border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300"
            }`}
            style={
              selectedFilter === "registered"
                ? { backgroundColor: "#0F6E00", color: "#ffffff" }
                : undefined
            }
          >
            My Registered
          </button>

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedFilter(category)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                selectedFilter === category
                  ? "bg-[#0F6E00] text-white shadow-xs"
                  : "border border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
              style={
                selectedFilter === category
                  ? { backgroundColor: "#0F6E00", color: "#ffffff" }
                  : undefined
              }
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {hasError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          Failed to load events. Please check your network connection.
        </div>
      )}

      {/* VIEW MODE: LIST VIEW */}
      {viewMode === "list" && (
        <div className="pt-1">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              {listEvents.length} {listEvents.length === 1 ? "Event" : "Events"}{" "}
              Listed
            </p>
          </div>

          {listEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F4E6] text-[#0F6E00]">
                <CalendarDays size={22} />
              </div>
              <h3 className="text-sm font-bold text-neutral-900">
                No events found
              </h3>
              <p className="mt-1 text-xs text-neutral-600">
                There are no events matching this filter. Switch filters or check back later!
              </p>
            </div>
          ) : (
            <div>
              {listEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleInAppRegister}
                  isRegistering={registeringId === event.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE: CALENDAR VIEW (Monarch iOS Reference) */}
      {viewMode === "calendar" && (
        <div className="space-y-4 pt-1">
          <div className="rounded-2xl border border-neutral-200/70 bg-white p-5 shadow-xs">
            {/* Month Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-sans text-neutral-900">
                {getMonthTitle(currentMonth)}
              </h2>

              <div className="flex items-center gap-1 text-neutral-600">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={goToPreviousMonth}
                  className="rounded-lg p-1.5 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  aria-label="Next month"
                  onClick={goToNextMonth}
                  className="rounded-lg p-1.5 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Days of Week Row */}
            <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-bold tracking-wider text-neutral-400">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
              {calendarDays.map((date) => {
                const isSelected = date.dateKey === selectedDate;
                const isToday = date.dateKey === todayKey;
                const hasEvent = eventDates.has(date.dateKey);

                return (
                  <button
                    key={date.dateKey}
                    type="button"
                    onClick={() => setSelectedDate(date.dateKey)}
                    className="flex flex-col items-center justify-center py-1 transition-transform active:scale-95"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
                        isSelected
                          ? "bg-[#0F6E00] font-bold text-white shadow-xs"
                          : isToday
                            ? "bg-[#E8F4E6] font-bold text-[#0F6E00]"
                            : date.isCurrentMonth
                              ? "font-semibold text-neutral-800 hover:bg-neutral-100"
                              : "font-normal text-neutral-300"
                      }`}
                      style={
                        isSelected ? { color: "#ffffff", backgroundColor: "#0F6E00" } : undefined
                      }
                    >
                      {date.day}
                    </span>

                    {/* Emerald Dot Indicator for Days with Events */}
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full transition-opacity ${
                        hasEvent
                          ? "bg-[#0F6E00]"
                          : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Header */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Events on {getDateLabel(selectedDate)}
            </p>
            <span className="rounded-full bg-[#E8F4E6] px-2.5 py-0.5 text-xs font-bold text-[#0F6E00]">
              {selectedDateEvents.length}{" "}
              {selectedDateEvents.length === 1 ? "session" : "sessions"}
            </span>
          </div>

          {/* Events for Selected Date */}
          {selectedDateEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-6 text-center">
              <p className="text-sm font-semibold text-neutral-800">
                No events scheduled for this day
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Tap dates marked with green dots to view scheduled events.
              </p>
            </div>
          ) : (
            <div>
              {selectedDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleInAppRegister}
                  isRegistering={registeringId === event.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
