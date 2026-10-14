"use client";

import { useId } from "react";
import { Clock } from "lucide-react";

/**
 * Amber status badge shown to the author while a post waits for moderation.
 * The explanation appears on hover, keyboard focus and tap (the badge is a
 * focusable button so it also works on touch screens).
 */
export default function PendingReviewBadge({
  label = "Pending Review",
}: {
  label?: string;
}) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-describedby={tooltipId}
        className="inline-flex items-center gap-1 rounded-full border border-brand-accent bg-brand-accent-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900 transition-transform duration-100 active:scale-95"
      >
        <Clock size={11} aria-hidden="true" />
        {label}
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-1.5 w-56 rounded-lg bg-neutral-900 px-3 py-2 text-left text-[11px] font-normal normal-case leading-snug tracking-normal text-white opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        Only you can see this post for now. It will be visible to everyone once
        a Pergas moderator approves it, typically within 24 hours.
      </span>
    </span>
  );
}
