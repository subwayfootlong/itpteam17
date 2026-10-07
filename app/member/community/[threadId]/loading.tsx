import MemberPageShell from '@/components/member/MemberPageShell';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DiscussionThreadLoading() {
  return (
    <MemberPageShell loading>
      <div
        className="flex min-h-[calc(100dvh-9rem)] items-center justify-center px-5 pb-20 text-[#315d25]"
        aria-label="Loading discussion"
      >
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner label="" size="lg" />
          <p className="member-text-base text-sm font-medium text-[#5F5E5E]">Loading discussion…</p>
        </div>
      </div>
    </MemberPageShell>
  );
}
