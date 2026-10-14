export type CalendarEvent = {
  title: string;
  /** YYYY-MM-DD */
  eventDate: string | null;
  /** "HH:MM", "HH:MM:SS" or "h:mm AM/PM" */
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  description?: string | null;
};

// Singapore has no daylight saving, so a fixed offset is safe.
const SGT_OFFSET_HOURS = 8;

function parseTime(value: string | null): { h: number; m: number } | null {
  if (!value) return null;

  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!match) return null;

  let h = Number(match[1]);
  const m = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;
  if (h > 23 || m > 59) return null;

  return { h, m };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toUtcStamp(dateKey: string, time: { h: number; m: number }) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(
    Date.UTC(year, month - 1, day, time.h - SGT_OFFSET_HOURS, time.m),
  );

  return (
    `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}` +
    `T${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}00Z`
  );
}

function toDateStamp(dateKey: string, addDays = 0) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + addDays));

  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** Returns start/end in the format both Google and iCalendar accept. */
function getRange(event: CalendarEvent) {
  if (!event.eventDate) return null;

  const start = parseTime(event.startTime);

  if (!start) {
    // No usable start time: treat as an all-day event
    return {
      allDay: true as const,
      start: toDateStamp(event.eventDate),
      end: toDateStamp(event.eventDate, 1),
    };
  }

  const parsedEnd = parseTime(event.endTime);
  // Default to a one-hour slot when the end time is missing or before the start
  const end =
    parsedEnd && parsedEnd.h * 60 + parsedEnd.m > start.h * 60 + start.m
      ? parsedEnd
      : { h: Math.min(start.h + 1, 23), m: start.m };

  return {
    allDay: false as const,
    start: toUtcStamp(event.eventDate, start),
    end: toUtcStamp(event.eventDate, end),
  };
}

export function buildGoogleCalendarUrl(event: CalendarEvent) {
  const range = getRange(event);
  if (!range) return null;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${range.start}/${range.end}`,
  });

  if (event.venue) params.set("location", event.venue);
  params.set(
    "details",
    "Pergas event. Present your digital membership card QR code at check-in.",
  );

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcsContent(event: CalendarEvent, uid: string) {
  const range = getRange(event);
  if (!range) return null;

  const now = new Date();
  const stamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pergas//Member Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@pergas-member-portal`,
    `DTSTAMP:${stamp}`,
    range.allDay ? `DTSTART;VALUE=DATE:${range.start}` : `DTSTART:${range.start}`,
    range.allDay ? `DTEND;VALUE=DATE:${range.end}` : `DTEND:${range.end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    ...(event.venue ? [`LOCATION:${escapeIcs(event.venue)}`] : []),
    `DESCRIPTION:${escapeIcs(
      "Pergas event. Present your digital membership card QR code at check-in.",
    )}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

export function downloadIcs(event: CalendarEvent, uid: string) {
  const content = buildIcsContent(event, uid);
  if (!content) return false;

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = event.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

  link.href = url;
  link.download = `${safeName || "pergas-event"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return true;
}
