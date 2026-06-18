import type { Metadata } from "next";
import AnnouncementsEngagement from "../components/announcements-engagement";
import { announcements } from "../data/announcements";

export const metadata: Metadata = {
  title: "Announcements & Community | Pergas Member Portal",
  description:
    "Read official Pergas announcements and engage in moderated member discussions.",
};

export default function AnnouncementsPage() {
  return <AnnouncementsEngagement announcements={announcements} />;
}
