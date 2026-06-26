import MemberPageShell from "@/components/member/MemberPageShell";
import CreateCommunityPostForm from "@/components/member/community/CreateCommunityPostForm";
import { getCommunityData } from "@/lib/community";
import { getCurrentUser } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export default async function CreateCommunityPostPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const data = await getCommunityData(user?.id);

  return (
    <MemberPageShell>
      <CreateCommunityPostForm
        groups={data.groups}
        initialGroupId={params.groupId ?? null}
      />
    </MemberPageShell>
  );
}
