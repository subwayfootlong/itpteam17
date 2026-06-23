import AnnouncementsEngagement from "@/components/member/AnnouncementsEngagement";
import MemberPageShell from "@/components/member/MemberPageShell";
import { loadCommunityPageData } from "@/lib/loadCommunityPage";

export const dynamic = "force-dynamic";

export default async function MemberCommunityPage() {
  const data = await loadCommunityPageData();

  return (
    <MemberPageShell>
      <AnnouncementsEngagement {...data} showChrome={false} />
    </MemberPageShell>
  );
}
