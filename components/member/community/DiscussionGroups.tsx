import type { DiscussionGroup, DiscussionGroupId } from "@/lib/communityTypes";
import MemberIcon from "@/components/member/MemberIcon";

export default function DiscussionGroups({
  groups,
  onOpenGroup,
  moderatorNotice,
  onContactModerator,
}: {
  groups: DiscussionGroup[];
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
            <MemberIcon name={group.icon} size={29} />
          </span>
          <span>
            <strong>{group.title}</strong>
            <small>{group.posts} posts</small>
          </span>
          <MemberIcon name="arrowRight" size={24} />
        </button>
      ))}

      <article className="moderator-card">
        <span>
          <MemberIcon name="help" size={28} />
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
