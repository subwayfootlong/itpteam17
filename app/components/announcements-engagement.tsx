"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type {
  Announcement,
  AnnouncementCategory,
  CommunityComment,
} from "../data/announcements";

type CategoryFilter = "All" | AnnouncementCategory;

const categories: CategoryFilter[] = [
  "All",
  "Official",
  "Events",
  "Membership",
  "Community",
];

const flaggedWords = ["spam", "scam", "hate", "offensive"];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    pin: <path d="M12 3v18M6 7h12" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    shield: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="brand">
      <Image
        className="brand-logo brand-logo--primary"
        src="/pergas-assets/pergas-logo-primary.png"
        width={250}
        height={50}
        alt="Pergas - Singapore Islamic Scholars and Religious Teachers Association"
        priority
      />
      <Image
        className="brand-logo brand-logo--secondary"
        src="/pergas-assets/pergas-logo-secondary.png"
        width={50}
        height={50}
        alt="Pergas"
        priority
      />
      <span>Member Portal</span>
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <BrandMark />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/benefit">Home</Link>
          <a href="#">Events</a>
          <Link href="/benefit">Benefits</Link>
          <Link className="is-active" href="/announcements" aria-current="page">
            Community
          </Link>
        </nav>
        <div className="member-actions">
          <Link
            className="notification-button"
            href="/notifications"
            aria-label="Notifications"
          >
            <Icon name="bell" size={21} />
            <span />
          </Link>
          <button className="member-profile">
            <span className="avatar">AK</span>
            <span className="member-copy">
              <strong>Ahmad Khalid</strong>
              <small>Active member</small>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <Link href="/benefit">
        <Icon name="home" size={21} />
        Home
      </Link>
      <a href="#">
        <Icon name="calendar" size={21} />
        Events
      </a>
      <Link href="/benefit">
        <Icon name="card" size={21} />
        Benefits
      </Link>
      <Link className="is-active" href="/announcements" aria-current="page">
        <Icon name="message" size={21} />
        Community
      </Link>
    </nav>
  );
}

function makePendingComment(body: string, sequence: number): CommunityComment {
  const normalized = body.toLowerCase();
  const isFlagged = flaggedWords.some((word) => normalized.includes(word));

  return {
    id: Date.now() + sequence,
    author: "Ahmad Khalid",
    role: "Active Member",
    body,
    postedAt: "Just now",
    status: isFlagged ? "flagged" : "pending",
  };
}

export default function AnnouncementsEngagement({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [selectedId, setSelectedId] = useState(announcements[0]?.id ?? 0);
  const [commentDraft, setCommentDraft] = useState("");
  const [localComments, setLocalComments] = useState<
    Record<number, CommunityComment[]>
  >({});

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return announcements.filter((announcement) => {
      const matchesCategory =
        category === "All" || announcement.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [
          announcement.title,
          announcement.summary,
          announcement.body,
          announcement.category,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [announcements, category, query]);

  const selected =
    announcements.find((announcement) => announcement.id === selectedId) ??
    announcements[0];

  const comments = selected
    ? [...selected.comments, ...(localComments[selected.id] ?? [])]
    : [];
  const approvedComments = comments.filter(
    (comment) => comment.status === "approved",
  );
  const reviewComments = comments.filter(
    (comment) => comment.status !== "approved",
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !commentDraft.trim()) return;

    const nextComment = makePendingComment(
      commentDraft.trim(),
      comments.length + 1,
    );

    setLocalComments((current) => ({
      ...current,
      [selected.id]: [...(current[selected.id] ?? []), nextComment],
    }));
    setCommentDraft("");
  };

  return (
    <div className="portal-shell announcements-page">
      <Header />
      <main>
        <section className="announcements-hero">
          <Image
            className="hero-floral"
            src="/pergas-assets/pergas-floral.png"
            width={476}
            height={473}
            alt=""
            aria-hidden="true"
          />
          <div className="page-container announcements-hero__content">
            <div>
              <span className="eyebrow">UC-06 COMMUNITY</span>
              <h1>Official updates and moderated discussion</h1>
              <p>
                Read announcements from Pergas and engage respectfully with
                member comments that remain subject to moderator review.
              </p>
            </div>
            <div className="moderation-card">
              <Icon name="shield" size={26} />
              <strong>Moderated space</strong>
              <span>Comments may be reviewed before publication.</span>
            </div>
          </div>
        </section>

        <section className="page-container announcements-workspace">
          <div className="announcements-toolbar">
            <label className="search-field">
              <span className="sr-only">Search announcements</span>
              <Icon name="search" size={21} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search announcements or discussions"
              />
            </label>
            <div className="category-tabs" aria-label="Announcement categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "is-active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item === "All" ? "All updates" : item}
                </button>
              ))}
            </div>
          </div>

          <div className="announcements-layout">
            <aside className="announcement-feed" aria-label="Announcement feed">
              <div className="feed-heading">
                <span className="section-label">OFFICIAL FEED</span>
                <strong>{filteredAnnouncements.length} updates</strong>
              </div>
              {filteredAnnouncements.map((announcement) => (
                <button
                  key={announcement.id}
                  className={`feed-card ${
                    selected?.id === announcement.id ? "is-active" : ""
                  }`}
                  onClick={() => setSelectedId(announcement.id)}
                >
                  <span className="feed-card__meta">
                    {announcement.pinned && <i>Pinned</i>}
                    {announcement.category}
                  </span>
                  <strong>{announcement.title}</strong>
                  <p>{announcement.summary}</p>
                  <span className="feed-card__footer">
                    {announcement.date}
                    <em>{announcement.comments.length} comments</em>
                  </span>
                </button>
              ))}
            </aside>

            {selected && (
              <article className="thread-panel">
                <div className="thread-panel__header">
                  <div>
                    <span className="section-label">
                      {selected.category.toUpperCase()}
                    </span>
                    <h2>{selected.title}</h2>
                    <p>
                      {selected.date} · {selected.readTime}
                    </p>
                  </div>
                  {selected.pinned && <span className="pinned-badge">Pinned</span>}
                </div>

                <p className="thread-summary">{selected.summary}</p>
                <div className="thread-body">
                  <p>{selected.body}</p>
                </div>

                <section className="comments-section">
                  <div className="comments-heading">
                    <div>
                      <span className="section-label">MEMBER DISCUSSION</span>
                      <h3>{approvedComments.length} approved comments</h3>
                    </div>
                    <span>
                      <Icon name="shield" size={16} />
                      Moderated
                    </span>
                  </div>

                  <div className="comment-list">
                    {approvedComments.map((comment) => (
                      <article className="comment-card" key={comment.id}>
                        <span className="comment-avatar">
                          {comment.author
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div>
                          <header>
                            <strong>{comment.author}</strong>
                            <small>{comment.role} · {comment.postedAt}</small>
                          </header>
                          <p>{comment.body}</p>
                        </div>
                      </article>
                    ))}
                  </div>

                  {reviewComments.length > 0 && (
                    <div className="review-queue" aria-live="polite">
                      <strong>Awaiting moderator review</strong>
                      {reviewComments.map((comment) => (
                        <p key={comment.id}>
                          {comment.status === "flagged"
                            ? "Your comment has been held for moderator review."
                            : "Your comment is pending approval."}
                        </p>
                      ))}
                    </div>
                  )}

                  {selected.commentsEnabled ? (
                    <form className="comment-composer" onSubmit={handleSubmit}>
                      <label htmlFor="comment">Post a comment</label>
                      <textarea
                        id="comment"
                        value={commentDraft}
                        onChange={(event) => setCommentDraft(event.target.value)}
                        maxLength={280}
                        placeholder="Share a respectful question or response..."
                      />
                      <div>
                        <small>{commentDraft.length}/280 characters</small>
                        <button type="submit" disabled={!commentDraft.trim()}>
                          Submit for review
                          <Icon name="send" size={15} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="comments-closed">
                      Comments are closed for this official announcement.
                    </div>
                  )}
                </section>
              </article>
            )}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
