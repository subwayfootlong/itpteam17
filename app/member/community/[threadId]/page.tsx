import { notFound } from "next/navigation";
import MemberPageShell from "@/components/member/MemberPageShell";
import DiscussionThreadDetail from "@/components/member/community/DiscussionThreadDetail";
import { getDiscussionThread } from "@/lib/community";
import { getCurrentUser } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function DiscussionThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const user = await getCurrentUser();
  const detail = await getDiscussionThread(threadId, user?.id);

  if (!detail) notFound();

  return (
    <MemberPageShell>
      <DiscussionThreadDetail
        thread={detail.thread}
        groupTitle={detail.groupTitle}
        memberName={user?.fullName ?? "Member"}
      />
    </MemberPageShell>
  );
}
