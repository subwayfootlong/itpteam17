import AnnouncementsEngagement from "@/components/member/AnnouncementsEngagement";
import MemberPageShell from "@/components/member/MemberPageShell";
import { loadCommunityPageData } from "@/lib/loadCommunityPage";

export const dynamic = "force-dynamic";

export default async function MemberCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; group?: string }>;
}) {
  const params = await searchParams;
  const data = await loadCommunityPageData();
  const initialTab = params.tab === "discussions" ? "discussions" : "announcements";
  const initialGroupId =
    initialTab === "discussions" && typeof params.group === "string"
      ? params.group
      : null;

  return (
    <MemberPageShell>
      <AnnouncementsEngagement
        {...data}
        showChrome={false}
        initialTab={initialTab}
        initialGroupId={initialGroupId}
      />
    </MemberPageShell>
  );
}
