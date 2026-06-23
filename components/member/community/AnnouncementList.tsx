import type { Announcement } from "@/lib/data/announcements";
import MemberIcon from "@/components/member/MemberIcon";

export function AnnouncementHeroCard({
  announcement,
  onOpen,
}: {
  announcement: Announcement;
  onOpen: (announcementId: string) => void;
}) {
  return (
    <article className="announcement-feature-card">
      {announcement.imageUrl && (
        <div className="announcement-feature-card__image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={announcement.imageUrl} alt={announcement.title} />
        </div>
      )}
      <div className="announcement-feature-card__body">
        <p className="official-line">
          <MemberIcon name="verified" size={17} />
          Official Admin <span>{announcement.date}</span>
        </p>
        <h2>{announcement.title}</h2>
        <p>{announcement.body}</p>
        <button type="button" onClick={() => onOpen(announcement.id)}>
          Read Full Announcement
          <MemberIcon name="arrowRight" size={23} />
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
    <section className="community-screen">
      {featured && (
        <AnnouncementHeroCard announcement={featured} onOpen={onOpen} />
      )}
      <div className="announcement-list">
        {rest.map((announcement) => (
          <article className="announcement-mini-card" key={announcement.id}>
            <div className="announcement-mini-card__top">
              <span className={`announcement-chip ${announcement.category}`}>
                {announcement.category}
              </span>
              <time>{announcement.date}</time>
            </div>
            <h3>{announcement.title}</h3>
            <p>{announcement.summary}</p>
            <button type="button" onClick={() => onOpen(announcement.id)}>
              {announcement.commentsEnabled ? "Learn more" : "Read notice"}
              <MemberIcon name="arrowRight" size={17} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
