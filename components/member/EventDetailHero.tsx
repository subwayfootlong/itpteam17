"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

export default function EventDetailHero({
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
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#173F14] via-[#245F1B] to-[#0F6E00] flex flex-col items-center justify-center p-6 text-white shadow-xs select-none">
        {/* Ambient glow effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#3FAE2A]/20 blur-xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/30"
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner backdrop-blur-md">
            <CalendarDays size={28} className="text-white" />
          </div>
          <span className="mt-2.5 text-xs font-bold uppercase tracking-widest text-[#BCE6B2]">
            Pergas Official Event
          </span>
        </div>

        {category && (
          <span className="absolute left-3.5 top-3.5 z-10 rounded-full border border-white/30 bg-white/95 px-3 py-1 text-xs font-bold text-[#0F6E00] shadow-xs backdrop-blur-md">
            {category}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={title}
        onError={() => setImageFailed(true)}
        className="h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      {category && (
        <span className="absolute left-3.5 top-3.5 rounded-full border border-white/40 bg-white/95 px-3 py-1 text-xs font-bold text-[#0F6E00] shadow-xs backdrop-blur-md">
          {category}
        </span>
      )}
    </div>
  );
}
