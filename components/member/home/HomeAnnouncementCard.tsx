"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Megaphone, CalendarDays, Gift, ChevronRight, ChevronLeft } from "lucide-react";

type HomeAnnouncementCardProps = {
  announcement: {
    id: string;
    title: string;
    content: string;
  } | null;
  featuredEvent?: {
    id: string;
    title: string;
    description: string | null;
    eventDate: string;
    venue?: string | null;
  } | null;
  featuredBenefit?: {
    id: string;
    title: string;
    description: string | null;
    discountText: string | null;
    merchantName?: string | null;
  } | null;
};

type Slide = {
  id: string;
  type: "announcement" | "event" | "benefit";
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeIcon: typeof Megaphone;
  title: string;
  content: string;
  href: string;
  ctaText: string;
};

export default function HomeAnnouncementCard({
  announcement,
  featuredEvent,
  featuredBenefit,
}: HomeAnnouncementCardProps) {
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = [];

    if (announcement) {
      list.push({
        id: `announcement-${announcement.id}`,
        type: "announcement",
        badgeLabel: "Announcement",
        badgeBg: "bg-[#E8F4E6]",
        badgeText: "text-[#0F6E00]",
        badgeBorder: "border-[#CDE5CA]",
        badgeIcon: Megaphone,
        title: announcement.title,
        content: announcement.content,
        href: "/member/community?tab=announcements",
        ctaText: "Read announcement",
      });
    }

    if (featuredEvent) {
      list.push({
        id: `event-${featuredEvent.id}`,
        type: "event",
        badgeLabel: "Featured Event",
        badgeBg: "bg-[#E8F7F5]",
        badgeText: "text-[#1E988A]",
        badgeBorder: "border-[#BFE5E0]",
        badgeIcon: CalendarDays,
        title: featuredEvent.title,
        content:
          featuredEvent.description ||
          "Join our upcoming community gathering and activities.",
        href: `/member/events/${featuredEvent.id}`,
        ctaText: "View event",
      });
    }

    if (featuredBenefit) {
      list.push({
        id: `benefit-${featuredBenefit.id}`,
        type: "benefit",
        badgeLabel: featuredBenefit.discountText
          ? `Member Perk • ${featuredBenefit.discountText}`
          : "Member Perk",
        badgeBg: "bg-[#FFF0D9]",
        badgeText: "text-[#7A4B00]",
        badgeBorder: "border-[#F5C985]",
        badgeIcon: Gift,
        title: featuredBenefit.merchantName || featuredBenefit.title,
        content:
          featuredBenefit.description ||
          "Exclusive discount and privilege for active Pergas members.",
        href: "/member/benefit",
        ctaText: "Explore perks",
      });
    }

    return list;
  }, [announcement, featuredEvent, featuredBenefit]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 4.5 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex] ?? slides[0];
  const BadgeIcon = currentSlide.badgeIcon;

  return (
    <section
      className="relative mt-4 overflow-hidden rounded-2xl border border-[#DFE7DC] bg-[#FAFBF9] p-4.5 shadow-sm transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured Community Updates"
    >
      <div className="relative z-10">
        {/* Header row with badge and navigation */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${currentSlide.badgeBg} ${currentSlide.badgeText} ${currentSlide.badgeBorder}`}
          >
            <BadgeIcon size={12} className={currentSlide.badgeText} />
            <span>{currentSlide.badgeLabel}</span>
          </span>

          <div className="flex items-center gap-1">
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex(
                      (prev) => (prev - 1 + slides.length) % slides.length,
                    )
                  }
                  aria-label="Previous update"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-700 active:scale-95"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) => (prev + 1) % slides.length)
                  }
                  aria-label="Next update"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/60 hover:text-neutral-700 active:scale-95"
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}

            <Link
              href={currentSlide.href}
              className="ml-1 inline-flex items-center gap-0.5 text-xs font-semibold text-[#0F6E00] transition-colors hover:underline"
            >
              <span>{currentSlide.ctaText}</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Dynamic Slide Content */}
        <div key={currentSlide.id} className="mt-3">
          <h2 className="line-clamp-1 text-base font-bold tracking-tight text-[#151C27]">
            {currentSlide.title}
          </h2>

          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5F5E5E]">
            {currentSlide.content}
          </p>
        </div>

        {/* Dot pagination indicator */}
        {slides.length > 1 && (
          <div
            className="mt-3 flex items-center justify-center gap-1.5 pt-1"
            aria-label="Carousel pagination"
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to slide ${idx + 1}: ${slide.title}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? "h-1.5 w-5 bg-[#0F6E00]"
                    : "h-1.5 w-1.5 bg-[#D5DED2] hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
