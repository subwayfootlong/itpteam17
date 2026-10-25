import { ChevronRight, Pin, ShieldCheck } from "lucide-react";
import type {
  Announcement,
  AnnouncementCategory,
} from "@/lib/data/announcements";

const categoryStyles: Record<
  AnnouncementCategory,
  { chip: string; bar: string }
> = {
  Official: {
    chip: "bg-brand-primary-100 member-dark:bg-brand-primary-900 text-brand-primary-900 member-dark:text-brand-primary-200",
    bar: "bg-brand-primary-700",
  },
  Events: {
    chip: "bg-brand-secondary-soft text-brand-secondary-dark",
    bar: "bg-brand-secondary",
  },
  Membership: {
    chip: "bg-rose-50 member-dark:bg-rose-950 text-brand-rose member-dark:text-rose-300",
    bar: "bg-brand-rose",
  },
  Community: {
    chip: "bg-brand-accent-soft member-dark:bg-member-raised text-amber-900 member-dark:text-amber-300",
    bar: "bg-brand-accent",
  },
};

function CategoryChip({ category }: { category: AnnouncementCategory }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryStyles[category].chip}`}
    >
      {category}
    </span>
  );
}

export function AnnouncementHeroCard({
  announcement,
  onOpen,
}: {
  announcement: Announcement;
  onOpen: (announcementId: string) => void;
}) {
  return (
    <article className="mb-5 overflow-hidden rounded-2xl border border-neutral-200 member-dark:border-member-border bg-white member-dark:bg-member-surface shadow-md">
      {announcement.imageUrl && (
        <div className="relative w-full overflow-hidden bg-neutral-100 member-dark:bg-member-raised">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="block h-auto w-full"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 member-dark:bg-member-surface/95 px-2.5 py-1 text-[11px] font-bold text-brand-primary-800 member-dark:text-brand-primary-200 shadow-xs">
            <Pin size={12} aria-hidden="true" />
            Featured
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <CategoryChip category={announcement.category} />
          <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 member-dark:text-neutral-400">
            <ShieldCheck
              size={13}
              className="text-brand-primary-800 member-dark:text-brand-primary-200"
              aria-hidden="true"
            />
            Official Admin · {announcement.date}
          </span>
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-neutral-950 member-dark:text-neutral-100">
          {announcement.title}
        </h2>
        <p className="mt-1 line-clamp-3 text-sm text-neutral-600 member-dark:text-neutral-300">
          {announcement.body}
        </p>
        <button
          type="button"
          onClick={() => onOpen(announcement.id)}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
        >
          Read Full Announcement
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function AnnouncementList({
  announcements,
  onOpen,
}: {
  announcements: Announcement[];
  onOpen: (announcementId: string) => void;
}) {
  const [featured, ...rest] = announcements;

  return (
    <section className="px-4 pb-28 pt-4">
      {featured && (
        <AnnouncementHeroCard announcement={featured} onOpen={onOpen} />
      )}

      {rest.length > 0 && (
        <h3 className="mb-2.5 px-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 member-dark:text-neutral-400">
          Earlier announcements
        </h3>
      )}

      <div className="space-y-3">
        {rest.map((announcement) => (
          <button
            key={announcement.id}
            type="button"
            onClick={() => onOpen(announcement.id)}
            className="relative block w-full overflow-hidden rounded-2xl border border-neutral-200 member-dark:border-member-border bg-white member-dark:bg-member-surface py-3.5 pl-5 pr-4 text-left shadow-sm transition-transform duration-100 hover:border-neutral-300 member-dark:hover:border-member-border active:scale-[0.98]"
          >
            <span
              aria-hidden="true"
              className={`absolute inset-y-0 left-0 w-1.5 ${categoryStyles[announcement.category].bar}`}
            />
            <div className="flex items-center justify-between gap-2">
              <CategoryChip category={announcement.category} />
              <time className="text-[11px] text-neutral-500 member-dark:text-neutral-400">
                {announcement.date}
              </time>
            </div>
            <h3 className="mt-2 text-sm font-semibold leading-snug text-neutral-950 member-dark:text-neutral-100">
              {announcement.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs text-neutral-600 member-dark:text-neutral-300">
              {announcement.summary}
            </p>
            <span className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-neutral-500 member-dark:text-neutral-400">{announcement.readTime}</span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-brand-primary-800 member-dark:text-brand-primary-200">
                {announcement.commentsEnabled ? "Learn more" : "Read notice"}
                <ChevronRight size={14} aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
