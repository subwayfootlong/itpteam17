"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Announcement, CommunityComment } from "../data/announcements";

type CommunityTab = "announcements" | "discussions";
type DiscussionGroupId = "general" | "spiritual";
type ThreadStatus = "approved" | "pending" | "flagged";

type DiscussionThread = {
  id: number;
  groupId: DiscussionGroupId;
  author: string;
  postedAt: string;
  title: string;
  body: string;
  votes: number;
  comments: CommunityComment[];
  hasImage?: boolean;
  status: ThreadStatus;
};

const flaggedWords = ["spam", "scam", "hate", "offensive"];

const groups: {
  id: DiscussionGroupId;
  title: string;
  posts: number;
  icon: string;
  tone: "green" | "gold";
}[] = [
  {
    id: "general",
    title: "General Community",
    posts: 124,
    icon: "message",
    tone: "green",
  },
  {
    id: "spiritual",
    title: "Spiritual Reflections",
    posts: 86,
    icon: "spark",
    tone: "gold",
  },
];

const initialThreads: DiscussionThread[] = [
  {
    id: 1,
    groupId: "general",
    author: "Brother Ahmad",
    postedAt: "2h ago",
    title: "Thoughts on the upcoming Majlis Ilmu?",
    body:
      "I am really looking forward to the community gathering next Saturday. The topic of sustainable living within our faith tradition feels timely.",
    votes: 142,
    status: "approved",
    comments: [
      {
        id: 101,
        author: "Sister Sarah",
        role: "Active Member",
        body: "The topic looks useful. I hope the recording is shared after the session.",
        postedAt: "1h ago",
        status: "approved",
      },
      {
        id: 102,
        author: "Ustaz Ridzuan",
        role: "Moderator",
        body: "We will update the thread once the programme team confirms post-event resources.",
        postedAt: "35m ago",
        status: "approved",
      },
    ],
  },
  {
    id: 2,
    groupId: "general",
    author: "Sister Sarah",
    postedAt: "5h ago",
    title: "Beautiful morning at the community center",
    body:
      "The new garden layout has made the center a peaceful spot for reflection before class.",
    votes: 89,
    hasImage: true,
    status: "approved",
    comments: [
      {
        id: 201,
        author: "Ahmad Khalid",
        role: "Active Member",
        body: "It looks welcoming. Thank you for sharing this.",
        postedAt: "3h ago",
        status: "approved",
      },
    ],
  },
  {
    id: 3,
    groupId: "general",
    author: "Ustaz Ridzuan",
    postedAt: "1d ago",
    title: "New Membership Portal Feedback",
    body:
      "We have just launched the new digital membership features. Please share your experience so the team can keep improving the portal.",
    votes: 305,
    status: "approved",
    comments: [
      {
        id: 301,
        author: "Nur Aisyah",
        role: "Associate Member",
        body: "The digital card is easy to find. The benefits page is also clearer now.",
        postedAt: "20h ago",
        status: "approved",
      },
    ],
  },
  {
    id: 4,
    groupId: "spiritual",
    author: "Sister Mariam",
    postedAt: "4h ago",
    title: "A short reflection after class",
    body:
      "Today reminded me how small consistent acts can make community learning more meaningful.",
    votes: 76,
    status: "approved",
    comments: [],
  },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrowRight: <path d="m9 18 6-6-6-6" />,
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
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
    comment: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    down: <path d="M12 5v14M19 12l-7 7-7-7" />,
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 2-2.6 2-2.6 4" />
        <path d="M12 17h.01" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m8 14 2.5-3 3 4 2-2.5L19 17" />
        <circle cx="8" cy="9" r="1" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.8 6.8-4.6M8.6 13.2l6.8 4.6" />
      </>
    ),
    spark: (
      <path d="m12 3 1.6 5.1L19 10l-5.4 1.9L12 17l-1.6-5.1L5 10l5.4-1.9ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
    ),
    up: <path d="M12 19V5M5 12l7-7 7 7" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    verified: (
      <>
        <path d="M12 2 9.5 5.2 5.5 5 5 9l-3 3 3 3 .5 4 4-.2L12 22l2.5-3.2 4 .2.5-4 3-3-3-3-.5-4-4 .2Z" />
        <path d="m8.8 12.2 2 2 4.4-4.6" />
      </>
    ),
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

function isFlagged(body: string) {
  const normalized = body.toLowerCase();
  return flaggedWords.some((word) => normalized.includes(word));
}

function makePendingComment(body: string, sequence: number): CommunityComment {
  return {
    id: Date.now() + sequence,
    author: "Ahmad Khalid",
    role: "Active Member",
    body,
    postedAt: "Just now",
    status: isFlagged(body) ? "flagged" : "pending",
  };
}

function makePendingThread(
  groupId: DiscussionGroupId,
  body: string,
): DiscussionThread {
  return {
    id: Date.now(),
    groupId,
    author: "Ahmad Khalid",
    postedAt: "Just now",
    title: body.length > 54 ? `${body.slice(0, 54)}...` : body,
    body,
    votes: 0,
    status: isFlagged(body) ? "flagged" : "pending",
    comments: [],
  };
}

function MobileHeader({
  title,
  canGoBack,
  onBack,
}: {
  title: string;
  canGoBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <header className="community-header">
      <div className="community-header__identity">
        {canGoBack ? (
          <button
            className="community-icon-button"
            type="button"
            onClick={onBack}
            aria-label="Go back"
          >
            <Icon name="back" size={24} />
          </button>
        ) : (
          <span className="community-avatar" aria-hidden="true">
            AK
          </span>
        )}
        <h1>{title}</h1>
      </div>
      <Link
        className="community-icon-button"
        href="/notifications"
        aria-label="Notifications"
      >
        <Icon name={canGoBack ? "search" : "bell"} size={23} />
      </Link>
    </header>
  );
}

function CommunityTabs({
  activeTab,
  onSelect,
}: {
  activeTab: CommunityTab;
  onSelect: (tab: CommunityTab) => void;
}) {
  return (
    <div className="community-tabs" role="tablist" aria-label="Community views">
      <button
        className={activeTab === "announcements" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("announcements")}
        role="tab"
        aria-selected={activeTab === "announcements"}
      >
        Announcements
      </button>
      <button
        className={activeTab === "discussions" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("discussions")}
        role="tab"
        aria-selected={activeTab === "discussions"}
      >
        Discussions
      </button>
    </div>
  );
}

function BottomNav() {
  return (
    <nav className="community-bottom-nav" aria-label="Mobile navigation">
      <Link href="/benefit">
        <Icon name="home" size={23} />
        Home
      </Link>
      <a href="#">
        <Icon name="calendar" size={23} />
        Events
      </a>
      <Link href="/benefit">
        <Icon name="card" size={23} />
        Benefits
      </Link>
      <Link className="is-active" href="/announcements" aria-current="page">
        <Icon name="message" size={23} />
        Community
      </Link>
      <a href="#">
        <Icon name="user" size={23} />
        Profile
      </a>
    </nav>
  );
}

function AnnouncementHeroCard({
  announcement,
  onOpen,
}: {
  announcement: Announcement;
  onOpen: (announcementId: number) => void;
}) {
  return (
    <article className="announcement-feature-card">
      <div className="announcement-feature-card__image">
        <span>Featured</span>
      </div>
      <div className="announcement-feature-card__body">
        <p className="official-line">
          <Icon name="verified" size={17} />
          Official Admin <span>2 hours ago</span>
        </p>
        <h2>{announcement.title}</h2>
        <p>{announcement.body}</p>
        <button type="button" onClick={() => onOpen(announcement.id)}>
          Read Full Announcement
          <Icon name="arrowRight" size={23} />
        </button>
      </div>
    </article>
  );
}

function AnnouncementList({
  announcements,
  onOpen,
}: {
  announcements: Announcement[];
  onOpen: (announcementId: number) => void;
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
              <Icon name="arrowRight" size={17} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AnnouncementDetail({
  announcement,
  localComments,
  onComment,
}: {
  announcement: Announcement;
  localComments: CommunityComment[];
  onComment: (announcementId: number, body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const comments = [...announcement.comments, ...localComments];
  const approvedComments = comments.filter(
    (comment) => comment.status === "approved",
  );
  const reviewComments = comments.filter(
    (comment) => comment.status !== "approved",
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onComment(announcement.id, draft.trim());
    setDraft("");
  };

  return (
    <section className="community-screen">
      <article className="announcement-detail-card">
        <div className="announcement-detail-card__image" />
        <p className="official-line">
          <Icon name="verified" size={17} />
          Official Admin <span>{announcement.date}</span>
        </p>
        <h2>{announcement.title}</h2>
        <p className="announcement-detail-card__summary">
          {announcement.summary}
        </p>
        <p>{announcement.body}</p>
      </article>

      <section className="moderated-comments">
        <div className="moderated-comments__heading">
          <div>
            <span>Moderated thread</span>
            <h3>{approvedComments.length} approved comments</h3>
          </div>
          <Icon name="verified" size={20} />
        </div>

        {approvedComments.map((comment) => (
          <article className="community-comment" key={comment.id}>
            <span aria-hidden="true">
              {comment.author
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <div>
              <strong>{comment.author}</strong>
              <small>
                {comment.role} - {comment.postedAt}
              </small>
              <p>{comment.body}</p>
            </div>
          </article>
        ))}

        {reviewComments.length > 0 && (
          <div className="community-review-note" aria-live="polite">
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

        {announcement.commentsEnabled ? (
          <form className="community-composer" onSubmit={handleSubmit}>
            <label htmlFor="announcement-comment">Post a comment</label>
            <textarea
              id="announcement-comment"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={280}
              placeholder="Share a respectful question or response..."
            />
            <div>
              <small>{draft.length}/280</small>
              <button type="submit" disabled={!draft.trim()}>
                Submit for review
                <Icon name="send" size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="community-review-note">
            <strong>Comments closed</strong>
            <p>This official announcement is read-only.</p>
          </div>
        )}
      </section>
    </section>
  );
}

function DiscussionGroups({
  onOpenGroup,
  moderatorNotice,
  onContactModerator,
}: {
  onOpenGroup: (groupId: DiscussionGroupId) => void;
  moderatorNotice: boolean;
  onContactModerator: () => void;
}) {
  return (
    <section className="community-screen discussion-groups">
      {groups.map((group) => (
        <button
          className="discussion-group-card"
          key={group.id}
          type="button"
          onClick={() => onOpenGroup(group.id)}
        >
          <span className={`discussion-group-card__icon is-${group.tone}`}>
            <Icon name={group.icon} size={29} />
          </span>
          <span>
            <strong>{group.title}</strong>
            <small>{group.posts} posts</small>
          </span>
          <Icon name="arrowRight" size={24} />
        </button>
      ))}

      <article className="moderator-card">
        <span>
          <Icon name="help" size={28} />
        </span>
        <h2>Need help?</h2>
        <p>
          Our moderators are available to ensure a safe and respectful
          environment for all members.
        </p>
        <button type="button" onClick={onContactModerator}>
          Contact Moderator
        </button>
        {moderatorNotice && (
          <small role="status">
            Moderator request sent. You will receive a notification soon.
          </small>
        )}
      </article>
    </section>
  );
}

function ThreadCard({
  thread,
  isExpanded,
  localComments,
  onToggle,
  onComment,
}: {
  thread: DiscussionThread;
  isExpanded: boolean;
  localComments: CommunityComment[];
  onToggle: () => void;
  onComment: (threadId: number, body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const comments = [...thread.comments, ...localComments];
  const approvedComments = comments.filter(
    (comment) => comment.status === "approved",
  );
  const reviewComments = comments.filter(
    (comment) => comment.status !== "approved",
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onComment(thread.id, draft.trim());
    setDraft("");
  };

  return (
    <article className="discussion-thread-card">
      <header>
        <span className="thread-initials">GC</span>
        <div>
          <strong>General Community</strong>
          <small>{thread.postedAt}</small>
        </div>
        <p>{thread.author}</p>
      </header>
      <h2>{thread.title}</h2>
      <p>{thread.body}</p>
      {thread.hasImage && <div className="thread-image-placeholder" />}
      {thread.status !== "approved" && (
        <div className="community-review-note compact">
          <strong>Pending review</strong>
          <p>Your post will appear publicly after moderator approval.</p>
        </div>
      )}
      <footer>
        <span className="vote-pill">
          <Icon name="up" size={22} />
          {thread.votes}
          <Icon name="down" size={22} />
        </span>
        <button type="button" onClick={onToggle}>
          <Icon name="comment" size={22} />
          {comments.length} comments
        </button>
        <button type="button" aria-label="Share thread">
          <Icon name="share" size={21} />
        </button>
      </footer>

      {isExpanded && (
        <div className="thread-comments">
          {approvedComments.map((comment) => (
            <article className="community-comment" key={comment.id}>
              <span aria-hidden="true">
                {comment.author
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <strong>{comment.author}</strong>
                <small>
                  {comment.role} - {comment.postedAt}
                </small>
                <p>{comment.body}</p>
              </div>
            </article>
          ))}
          {reviewComments.length > 0 && (
            <div className="community-review-note">
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
          <form className="community-composer compact" onSubmit={handleSubmit}>
            <label htmlFor={`thread-comment-${thread.id}`}>
              Add a comment
            </label>
            <textarea
              id={`thread-comment-${thread.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={220}
              placeholder="Join the discussion respectfully..."
            />
            <div>
              <small>{draft.length}/220</small>
              <button type="submit" disabled={!draft.trim()}>
                Submit
                <Icon name="send" size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

function DiscussionFeed({
  groupId,
  threads,
  localComments,
  expandedThreadId,
  onExpandThread,
  onComment,
  onPost,
}: {
  groupId: DiscussionGroupId;
  threads: DiscussionThread[];
  localComments: Record<number, CommunityComment[]>;
  expandedThreadId: number | null;
  onExpandThread: (threadId: number) => void;
  onComment: (threadId: number, body: string) => void;
  onPost: (groupId: DiscussionGroupId, body: string) => void;
}) {
  const [postDraft, setPostDraft] = useState("");
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const visibleThreads = threads.filter((thread) => thread.groupId === groupId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postDraft.trim()) return;
    onPost(groupId, postDraft.trim());
    setPostDraft("");
  };

  return (
    <section className="community-screen discussion-feed">
      <form className="share-thoughts" onSubmit={handleSubmit}>
        <span className="community-avatar" aria-hidden="true">
          AK
        </span>
        <label className="sr-only" htmlFor="community-post">
          Share your thoughts with the community
        </label>
        <textarea
          id="community-post"
          value={postDraft}
          onChange={(event) => setPostDraft(event.target.value)}
          placeholder={`Share your thoughts with ${group.title.toLowerCase()}...`}
          maxLength={220}
        />
        <button type="submit" disabled={!postDraft.trim()} aria-label="Post">
          <Icon name={postDraft.trim() ? "send" : "image"} size={23} />
        </button>
      </form>

      {visibleThreads.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          isExpanded={expandedThreadId === thread.id}
          localComments={localComments[thread.id] ?? []}
          onToggle={() => onExpandThread(thread.id)}
          onComment={onComment}
        />
      ))}

      <button className="floating-compose" type="button" aria-label="Compose">
        <Icon name="edit" size={27} />
      </button>
    </section>
  );
}

export default function AnnouncementsEngagement({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const [activeTab, setActiveTab] = useState<CommunityTab>("announcements");
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<
    number | null
  >(null);
  const [selectedGroupId, setSelectedGroupId] =
    useState<DiscussionGroupId | null>(null);
  const [threads, setThreads] = useState(initialThreads);
  const [expandedThreadId, setExpandedThreadId] = useState<number | null>(1);
  const [moderatorNotice, setModeratorNotice] = useState(false);
  const [announcementComments, setAnnouncementComments] = useState<
    Record<number, CommunityComment[]>
  >({});
  const [threadComments, setThreadComments] = useState<
    Record<number, CommunityComment[]>
  >({});

  const selectedAnnouncement = useMemo(
    () =>
      announcements.find(
        (announcement) => announcement.id === selectedAnnouncementId,
      ),
    [announcements, selectedAnnouncementId],
  );

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const pageTitle = selectedAnnouncement
    ? "Announcement"
    : selectedGroup
      ? selectedGroup.title
      : "Pergas";

  const canGoBack = Boolean(selectedAnnouncement || selectedGroupId);

  const handleBack = () => {
    if (selectedAnnouncement) {
      setSelectedAnnouncementId(null);
      return;
    }

    setSelectedGroupId(null);
  };

  const handleSelectTab = (tab: CommunityTab) => {
    setActiveTab(tab);
    setSelectedAnnouncementId(null);
    setSelectedGroupId(null);
  };

  const handleAnnouncementComment = (announcementId: number, body: string) => {
    setAnnouncementComments((current) => ({
      ...current,
      [announcementId]: [
        ...(current[announcementId] ?? []),
        makePendingComment(body, (current[announcementId] ?? []).length + 1),
      ],
    }));
  };

  const handleThreadComment = (threadId: number, body: string) => {
    setThreadComments((current) => ({
      ...current,
      [threadId]: [
        ...(current[threadId] ?? []),
        makePendingComment(body, (current[threadId] ?? []).length + 1),
      ],
    }));
    setExpandedThreadId(threadId);
  };

  const handlePost = (groupId: DiscussionGroupId, body: string) => {
    const pendingThread = makePendingThread(groupId, body);
    setThreads((current) => [pendingThread, ...current]);
    setExpandedThreadId(pendingThread.id);
  };

  return (
    <div className="community-app-shell">
      <MobileHeader title={pageTitle} canGoBack={canGoBack} onBack={handleBack} />
      {!selectedAnnouncement && !selectedGroupId && (
        <CommunityTabs activeTab={activeTab} onSelect={handleSelectTab} />
      )}

      <main className="community-main">
        {selectedAnnouncement ? (
          <AnnouncementDetail
            announcement={selectedAnnouncement}
            localComments={announcementComments[selectedAnnouncement.id] ?? []}
            onComment={handleAnnouncementComment}
          />
        ) : selectedGroupId ? (
          <DiscussionFeed
            groupId={selectedGroupId}
            threads={threads}
            localComments={threadComments}
            expandedThreadId={expandedThreadId}
            onExpandThread={(threadId) =>
              setExpandedThreadId((current) =>
                current === threadId ? null : threadId,
              )
            }
            onComment={handleThreadComment}
            onPost={handlePost}
          />
        ) : activeTab === "announcements" ? (
          <AnnouncementList
            announcements={announcements}
            onOpen={setSelectedAnnouncementId}
          />
        ) : (
          <DiscussionGroups
            onOpenGroup={setSelectedGroupId}
            moderatorNotice={moderatorNotice}
            onContactModerator={() => setModeratorNotice(true)}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
