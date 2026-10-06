import Link from "next/link";
import type { DiscussionThread } from "@/lib/communityTypes";
import MemberIcon from "@/components/member/MemberIcon";

export default function ThreadCard({
  thread,
  groupTitle,
}: {
  thread: DiscussionThread;
  groupTitle: string;
}) {
  const comments = thread.comments.filter((comment) => comment.status === "approved");
  const authorInitials =
    thread.author
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "M";

  return (
    <article className="discussion-thread-card">
      <header>
        <span className="thread-initials">{authorInitials}</span>
        <div>
          <strong>{groupTitle}</strong>
          <small>Posted by {thread.author} · {thread.postedAt}</small>
        </div>
      </header>
      <Link className="thread-card-link" href={`/member/community/${thread.id}`}>
        <h2>{thread.title}</h2>
      </Link>
      <p>{thread.body}</p>
      {thread.hasImage && <div className="thread-image-placeholder" />}
      {thread.status !== "approved" && (
        <div className="community-review-note compact">
          <strong>Pending review</strong>
          <p>Your post will appear publicly after moderator approval.</p>
        </div>
      )}
      <footer>
        <Link href={`/member/community/${thread.id}`}>
          <MemberIcon name="comment" size={22} />
          {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </Link>
        <Link className="thread-open-link" href={`/member/community/${thread.id}`}>
          Open discussion
          <MemberIcon name="arrowRight" size={18} />
        </Link>
      </footer>
    </article>
  );
}
