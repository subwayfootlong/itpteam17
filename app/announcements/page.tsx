import type { Metadata } from "next";
import AnnouncementsEngagement from "@/components/member/AnnouncementsEngagement";
import { loadCommunityPageData } from "@/lib/loadCommunityPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Announcements & Community | Pergas Member Portal",
  description:
    "Read official Pergas announcements and engage in moderated member discussions.",
};

export default async function AnnouncementsPage() {
  const data = await loadCommunityPageData();
  return <AnnouncementsEngagement {...data} />;
}
