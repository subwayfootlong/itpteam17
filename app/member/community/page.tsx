import AnnouncementsEngagement from "@/app/components/announcements-engagement";
import { announcements } from "@/app/data/announcements";
import MemberBottomNav from "@/components/MemberBottomNav";
import MemberTopBar from "@/components/MemberTopBar";
import { getCurrentUser } from "@/lib/currentUser";
import { getCommunityData } from "@/lib/community";
import type { ReactNode } from "react";

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
      <CommunityFrame>
        <AnnouncementsEngagement
          announcements={communityData.announcements}
          groups={communityData.groups.length ? communityData.groups : undefined}
          threads={communityData.threads.length ? communityData.threads : undefined}
          showChrome={false}
        />
      </CommunityFrame>
    );
  }

  return (
    <CommunityFrame>
      <AnnouncementsEngagement announcements={announcements} showChrome={false} />
    </CommunityFrame>
  );
}

function CommunityFrame({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <section className="min-h-screen w-full max-w-md bg-[#FFFFFF] pb-24">
        <MemberTopBar />
        {children}
        <MemberBottomNav />
      </section>
    </main>
  );
}
