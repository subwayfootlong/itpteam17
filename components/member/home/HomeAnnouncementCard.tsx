"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck,
  CalendarDays,
  Gift,
  MapPin,
  Megaphone,
} from "lucide-react";
import { formatMemberDate } from "@/lib/dates";

type HomeEvent = {
  id: string;
  title: string;
  description?: string | null;
  eventDate: string;
  startTime: string | null;
  venue: string | null;
  category?: string | null;
  imageUrl: string | null;
};

type HomeAnnouncementCardProps = {
  announcement: {
    id: string;
    title: string;
    content: string;
    imageUrl?: string | null;
  } | null;
  nextRegisteredEvent?: HomeEvent | null;
  featuredEvents?: HomeEvent[];
  featuredBenefit?: {
    id: string;
    title: string;
    description: string | null;
    discountText: string | null;
    imageUrl: string | null;
    merchantName?: string | null;
  } | null;
};

type SlideKind = "registered" | "announcement" | "event" | "benefit";

type Slide = {
  id: string;
  kind: SlideKind;
  badge: string;
  title: string;
  lines: string[];
  summary: string | null;
  imageUrl: string | null;
  href: string;
  cta: string;
  icon: typeof Megaphone;
};

// Each kind has its own soft tint so members can tell slides apart at a glance
const kindStyles: Record<SlideKind, { chip: string; tile: string }> = {
  registered: {
    chip: "bg-brand-primary-100 text-brand-primary-900",
    tile: "bg-brand-primary-100 text-brand-primary-800",
  },
  announcement: {
    chip: "bg-brand-secondary-soft text-brand-secondary-dark",
    tile: "bg-brand-secondary-soft text-brand-secondary-dark",
  },
  event: {
    chip: "bg-sky-50 text-sky-900",
    tile: "bg-sky-50 text-sky-800",
  },
  benefit: {
    chip: "bg-brand-accent-soft text-amber-900",
    tile: "bg-brand-accent-soft text-amber-900",
  },
};

function getTodayInSingapore() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
  }).format(new Date());
}

function relativeDay(eventDate: string) {
  const today = new Date(`${getTodayInSingapore()}T00:00:00`);
  const target = new Date(`${eventDate}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (days < 0 || days > 14) return null;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function formatSchedule(eventDate: string, startTime: string | null) {
  const date = formatMemberDate(eventDate);
  if (!startTime) return date;

  const time = new Date(`2000-01-01T${startTime}`);
  if (Number.isNaN(time.getTime())) return `${date} • ${startTime}`;

  return `${date} • ${time.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function eventLines(event: HomeEvent) {
  return [
    formatSchedule(event.eventDate, event.startTime),
    ...(event.venue ? [event.venue] : []),
  ];
}

/** Fixed-size thumbnail: cropping is fine here, the full flyer is on the detail page. */
function SlideThumb({ slide }: { slide: Slide }) {
  const Icon = slide.icon;
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(slide.imageUrl) && !failed;

  return (
    <div
      className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
        showImage ? "bg-neutral-100" : kindStyles[slide.kind].tile
      }`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.imageUrl as string}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <Icon size={32} strokeWidth={1.8} aria-hidden="true" />
      )}
    </div>
  );
}

export default function HomeAnnouncementCard({
  announcement,
  nextRegisteredEvent,
  featuredEvents = [],
  featuredBenefit,
}: HomeAnnouncementCardProps) {
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [];

    if (nextRegisteredEvent) {
      const when = relativeDay(nextRegisteredEvent.eventDate);

      list.push({
        id: `registered-${nextRegisteredEvent.id}`,
        kind: "registered",
        badge: when ? `Registered • ${when}` : "Registered",
        title: nextRegisteredEvent.title,
        lines: eventLines(nextRegisteredEvent),
        summary: "Show your digital card at check-in.",
        imageUrl: nextRegisteredEvent.imageUrl,
        href: `/member/events/${nextRegisteredEvent.id}`,
        cta: "View registration",
        icon: CalendarCheck,
      });
    }

    if (announcement) {
      list.push({
        id: `announcement-${announcement.id}`,
        kind: "announcement",
        badge: "Announcement",
        title: announcement.title,
        lines: [],
        summary: announcement.content || null,
        imageUrl: announcement.imageUrl ?? null,
        href: "/member/community?tab=announcements",
        cta: "Read announcement",
        icon: Megaphone,
      });
    }

    featuredEvents
      .filter((event) => event.id !== nextRegisteredEvent?.id)
      .slice(0, 3)
      .forEach((event) => {
        list.push({
          id: `event-${event.id}`,
          kind: "event",
          badge: event.category || "Upcoming event",
          title: event.title,
          lines: eventLines(event),
          summary: event.description ?? null,
          imageUrl: event.imageUrl,
          href: `/member/events/${event.id}`,
          cta: "View event",
          icon: CalendarDays,
        });
      });

    if (featuredBenefit) {
      list.push({
        id: `benefit-${featuredBenefit.id}`,
        kind: "benefit",
        badge: featuredBenefit.discountText
          ? `Member perk • ${featuredBenefit.discountText}`
          : "Member perk",
        title: featuredBenefit.merchantName || featuredBenefit.title,
        lines: [],
        summary:
          featuredBenefit.description ||
          "Exclusive discount and privilege for active Pergas members.",
        imageUrl: featuredBenefit.imageUrl,
        href: "/member/benefit",
        cta: "Explore perks",
        icon: Gift,
      });
    }

    return list;
  }, [announcement, nextRegisteredEvent, featuredEvents, featuredBenefit]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    scroller.scrollTo({ left: next * scroller.clientWidth, behavior: "smooth" });
  }, []);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;

    setIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
  };

  // Auto-advance, unless the member is interacting or prefers reduced motion
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      goTo((index + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, index, goTo]);

  if (slides.length === 0) return null;

  return (
    <section
      className="mt-5"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <h2 className="mb-2.5 text-base font-bold tracking-tight text-neutral-900">
        Highlights
      </h2>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory overflow-x-auto px-1 pb-3 pt-1"
      >
        {slides.map((slide, slideIndex) => {
          const Icon = slide.icon;

          return (
            <article
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${slides.length}`}
              className="w-full shrink-0 snap-center px-0.5"
            >
              <div className="flex h-full min-h-[236px] flex-col rounded-3xl border border-neutral-100 bg-white p-5 shadow-[0_6px_16px_-10px_rgba(23,63,20,0.35)]">
                <div className="flex items-start gap-3.5">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${kindStyles[slide.kind].chip}`}
                    >
                      <Icon size={12} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{slide.badge}</span>
                    </span>
                    <h3 className="mt-2.5 line-clamp-3 text-lg font-bold leading-snug text-neutral-950">
                      {slide.title}
                    </h3>
                  </div>
                  <SlideThumb slide={slide} />
                </div>

                {slide.lines.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[13px] text-neutral-700">
                    {slide.lines.map((line, lineIndex) => (
                      <li key={line} className="flex items-center gap-2">
                        {lineIndex === 0 ? (
                          <CalendarDays
                            size={14}
                            className="shrink-0 text-brand-primary-800"
                            aria-hidden="true"
                          />
                        ) : (
                          <MapPin
                            size={14}
                            className="shrink-0 text-brand-primary-800"
                            aria-hidden="true"
                          />
                        )}
                        <span className="truncate">{line}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {slide.summary && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-neutral-600">
                    {slide.summary}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  <Link
                    href={slide.href}
                    className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-primary-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {slides.length > 1 && (
        <div
          className="flex items-center justify-center gap-1.5"
          role="tablist"
          aria-label="Choose highlight"
        >
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Go to highlight ${dotIndex + 1}`}
              onClick={() => goTo(dotIndex)}
              className={`h-2 rounded-full transition-all duration-200 ${
                dotIndex === index
                  ? "w-5 bg-brand-primary-800"
                  : "w-2 bg-neutral-300 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
