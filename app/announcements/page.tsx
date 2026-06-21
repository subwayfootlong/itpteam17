import type { Metadata } from "next";
import AnnouncementsEngagement from "../components/announcements-engagement";
import { announcements } from "../data/announcements";
import { getCurrentUser } from "@/lib/currentUser";
import { getCommunityData } from "@/lib/community";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Announcements & Community | Pergas Member Portal",
  description:
    "Read official Pergas announcements and engage in moderated member discussions.",
};

export default async function AnnouncementsPage() {
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
