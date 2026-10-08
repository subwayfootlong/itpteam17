import { ChevronRight, HelpCircle, MessageSquare } from "lucide-react";
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
    <section className="px-4 pb-28 pt-4">
      <h3 className="mb-2.5 px-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
        Discussion spaces
      </h3>

      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onOpenGroup(group.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 text-left shadow-sm transition-transform duration-100 hover:border-neutral-300 active:scale-[0.98]"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  group.tone === "gold"
                    ? "bg-brand-accent-soft text-amber-900"
                    : "bg-brand-primary-100 text-brand-primary-800"
                }`}
              >
                <MemberIcon name={group.icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-semibold text-neutral-950">
                  {group.title}
                </strong>
                <small className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                  <MessageSquare size={12} aria-hidden="true" />
                  {group.posts} {group.posts === 1 ? "post" : "posts"}
                </small>
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-neutral-300"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-base font-semibold text-neutral-900">
            No discussion spaces yet
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Ask an admin to create discussion groups before members can post.
          </p>
        </div>
      )}

      <article className="mt-5 rounded-2xl border border-brand-primary-200 bg-brand-primary-50 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary-800 shadow-xs">
            <HelpCircle size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-neutral-900">Need help?</h2>
            <p className="mt-1 text-xs text-neutral-600">
              Our moderators ensure a safe and respectful environment for all
              members.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onContactModerator}
          className="mt-3 min-h-11 w-full rounded-xl border border-brand-primary-800 bg-white px-4 py-2.5 text-sm font-semibold text-brand-primary-800 transition-transform duration-100 hover:bg-brand-primary-100 active:scale-[0.98]"
        >
          Contact Moderator
        </button>
        {moderatorNotice && (
          <small
            role="status"
            className="mt-2 block text-xs font-medium text-brand-primary-800"
          >
            Moderator request sent. You will receive a notification soon.
          </small>
        )}
      </article>
    </section>
  );
}
