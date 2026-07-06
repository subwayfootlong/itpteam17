"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import type { EventRow } from "@/app/member/events/page";

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
    month: "long",
    day: "numeric",
  });
}

function formatTime(startTime: string | null, endTime: string | null) {
  if (!startTime && !endTime) return "Time to be confirmed";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime;
}

function EventDescription({ description, eventId }: { description: string; eventId: string }) {
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
    <div className="mt-2 min-h-[3.75rem]">
      <p
        ref={descriptionRef}
        className="line-clamp-2 break-words text-sm leading-5 text-[#5F5E5E]"
      >
        {description}
      </p>
      {isTruncated && (
        <Link href={`/member/events/${eventId}`} className="mt-1 inline-block text-sm font-semibold text-[#0F6E00]">
          ... See more
        </Link>
      )}
    </div>
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

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const eventDates = useMemo(
    () =>
      new Set(
        events.filter((event) => event.event_date).map((event) => event.event_date as string)
      ),
    [events]
  );

  const selectedDateEvents = useMemo(
    () => events.filter((event) => event.event_date === selectedDate),
    [events, selectedDate]
  );

  function goToPreviousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  return (
    <div className="px-5 py-5">
      <div className="rounded-2xl border border-gray-200 bg-[#FFFFFF] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#151C27]">{getMonthTitle(currentMonth)}</h2>

          <div className="flex gap-5 text-[#151C27]">
            <button type="button" aria-label="Previous month" onClick={goToPreviousMonth}>
              <ChevronLeft size={26} />
            </button>

            <button type="button" aria-label="Next month" onClick={goToNextMonth}>
              <ChevronRight size={26} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 text-center text-[#5F5E5E]">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <p key={`${day}-${index}`}>{day}</p>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-7 gap-y-3 text-center text-lg text-[#151C27]">
          {calendarDays.map((date) => {
            const isSelected = date.dateKey === selectedDate;
            const hasEvent = eventDates.has(date.dateKey);

            return (
              <button
                key={date.dateKey}
                type="button"
                onClick={() => setSelectedDate(date.dateKey)}
                className="flex h-14 flex-col items-center justify-start"
              >
                <span
                  className={
                    isSelected
                      ? "flex h-10 w-10 items-center justify-center rounded-full bg-[#0F6E00] font-bold text-white"
                      : date.isCurrentMonth
                        ? "flex h-10 w-10 items-center justify-center text-[#151C27]"
                        : "flex h-10 w-10 items-center justify-center text-gray-300"
                  }
                >
                  {date.day}
                </span>

                <span
                  className={
                    hasEvent && !isSelected ? "mt-1 h-1 w-1 rounded-full bg-[#0F6E00]" : "mt-1 h-1 w-1"
                  }
                />
              </button>
            );
          })}
        </div>
      </div>

      {hasError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load events. Please check your Supabase connection.
        </div>
      )}

      <div className="mt-6 border-l-4 border-[#0F6E00] pl-4">
        <p className="text-[#151C27]">Upcoming on {getDateLabel(selectedDate)}</p>

        <p className="text-[#151C27]">
          {selectedDateEvents.length}{" "}
          {selectedDateEvents.length === 1 ? "session" : "sessions"} scheduled
        </p>
      </div>

      <div className="mt-6 min-h-[360px] space-y-7">
        {selectedDateEvents.length === 0 && !hasError ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-gray-200 p-6 text-center text-[#5F5E5E]">
            No published events on this date.
          </div>
        ) : (
          selectedDateEvents.map((event) => {
            const isFull = event.spots_available !== null && event.spots_available <= 0;
            const hasRsvpLink = Boolean(event.external_rsvp_url?.trim());

            const buttonLabel = isFull ? "Full" : hasRsvpLink ? "Register" : "Unavailable";

            return (
              <article
                key={event.id}
                className="flex h-[31rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#FFFFFF] shadow-sm"
              >
                <div className="relative h-48 bg-gray-200">
                  <Link
                    href={`/member/events/${event.id}`}
                    aria-label={`Open details for ${event.title}`}
                    className="block h-full w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image_url || "/event-placeholder.jpg"}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {event.category && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#0F6E00] px-4 py-1 text-sm text-white">
                      {event.category}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="min-h-[3.5rem] text-2xl font-bold leading-snug text-[#151C27]">
                    <Link
                      href={`/member/events/${event.id}`}
                      className="line-clamp-2 inline-block"
                    >
                      {event.title}
                    </Link>
                  </h3>

                  {event.description ? (
                    <EventDescription description={event.description} eventId={event.id} />
                  ) : (
                    <div className="mt-2 min-h-[3.75rem]" />
                  )}

                  <div className="mt-4 space-y-3 text-[#151C27]">
                    <p className="flex items-center gap-2">
                      <Clock size={18} strokeWidth={2.2} className="text-[#5F5E5E]" />
                      {formatTime(event.start_time, event.end_time)}
                    </p>

                    <p className="flex items-center gap-2">
                      <MapPin size={18} strokeWidth={2.2} className="text-[#5F5E5E]" />
                      {event.venue || "Venue to be confirmed"}
                    </p>
                  </div>

                  {!isFull && hasRsvpLink ? (
                    <a
                      href={event.external_rsvp_url!.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto block rounded-xl bg-[#0F6E00] py-4 text-center font-semibold text-white"
                    >
                      {buttonLabel}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="mt-auto w-full rounded-xl border border-[#5F5E5E] py-4 font-semibold text-[#151C27]"
                    >
                      {buttonLabel}
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
