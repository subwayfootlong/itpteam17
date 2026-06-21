import AnnouncementsEngagement from "@/app/components/announcements-engagement";
import { announcements } from "@/app/data/announcements";
import { getCurrentUser } from "@/lib/currentUser";
import { getCommunityData } from "@/lib/community";

export const dynamic = "force-dynamic";

export default async function MemberCommunityPage() {
  let communityData: Awaited<ReturnType<typeof getCommunityData>> | null = null;
  const currentUser = await getCurrentUser();

  try {
    communityData = await getCommunityData(currentUser?.id);
  } catch (error) {
    console.warn("Using community fallback data:", error);
  }

  if (communityData?.announcements.length) {
    return (
      <AnnouncementsEngagement
        announcements={communityData.announcements}
        groups={communityData.groups.length ? communityData.groups : undefined}
        threads={communityData.threads.length ? communityData.threads : undefined}
      />
    );
  }

  return <AnnouncementsEngagement announcements={announcements} />;
}
