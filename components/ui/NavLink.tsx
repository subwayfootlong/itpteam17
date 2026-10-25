"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/**
 * Drop-in replacement for next/link that confirms the tap immediately.
 *
 * While the navigation is pending (before the next screen is ready) the link
 * dims and, for button- and card-style links, a spinner appears over it. The
 * spinner is an absolutely positioned overlay, so nothing shifts or resizes.
 * Plain inline text links only dim, because a spinner would not fit.
 */

const POSITIONED = /\b(absolute|fixed|sticky|relative)\b/;
const BLOCK_LIKE = /\b(block|flex|inline-flex|grid|inline-block)\b/;
const DARK_SURFACE =
  /\btext-white\b|\bbg-brand-primary-(700|800|900)\b|\bbg-\[#(0F6E00|149100|0F7A00|7A4B00|173F14)\]/i;

function PendingIndicator({
  showSpinner,
  dark,
}: {
  showSpinner: boolean;
  dark: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      {/* Hook for the parent's has-[] styles and for assistive tech */}
      <span
        aria-hidden="true"
        data-pending={pending ? "true" : "false"}
        className="hidden"
      />
      <span className="sr-only" role="status">
        {pending ? "Loading" : ""}
      </span>
      {showSpinner && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] transition-opacity duration-150 ${
            pending ? "opacity-100" : "opacity-0"
          } ${dark ? "bg-brand-primary-900/70" : "bg-white/85 member-dark:bg-member-surface/85"}`}
        >
          {pending && <LoadingSpinner label="" size="sm" light={dark} />}
        </span>
      )}
    </>
  );
}

export default function NavLink({
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link>) {
  const classes = typeof className === "string" ? className : "";
  const isBlockLike = BLOCK_LIKE.test(classes);
  const dark = DARK_SURFACE.test(classes);

  return (
    <Link
      {...props}
      className={`${POSITIONED.test(classes) ? "" : "relative "}${classes} has-[[data-pending=true]]:cursor-progress has-[[data-pending=true]]:opacity-80`}
    >
      {children}
      <PendingIndicator showSpinner={isBlockLike} dark={dark} />
    </Link>
  );
}
