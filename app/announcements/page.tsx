import type { Metadata } from "next";
import AnnouncementsEngagement from "../components/announcements-engagement";
import { announcements } from "../data/announcements";
import { getCommunityData } from "@/lib/uc6Community";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Announcements & Community | Pergas Member Portal",
  description:
    "Read official Pergas announcements and engage in moderated member discussions.",
};

export default async function AnnouncementsPage() {
  let communityData: Awaited<ReturnType<typeof getCommunityData>> | null = null;

  try {
    communityData = await getCommunityData();
  } catch (error) {
    console.warn("Using UC6 fallback data:", error);
  }

  if (communityData?.announcements.length && communityData.groups.length) {
    return (
      <AnnouncementsEngagement
        announcements={communityData.announcements}
        groups={communityData.groups}
        threads={communityData.threads}
      />
    );
  }

  return <AnnouncementsEngagement announcements={announcements} />;
}
