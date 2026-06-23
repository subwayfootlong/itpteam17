import { getCommunityData } from "./community";
import { getCurrentUser } from "./currentUser";
import { announcements } from "./data/announcements";
import type { Announcement } from "./data/announcements";
import type { DiscussionGroup, DiscussionThread } from "./communityTypes";

export type CommunityPageProps = {
  announcements: Announcement[];
  groups?: DiscussionGroup[];
  threads?: DiscussionThread[];
  memberName: string;
};

export async function loadCommunityPageData(): Promise<CommunityPageProps> {
  const currentUser = await getCurrentUser();
  const memberName = currentUser?.fullName ?? "Member";

  try {
    const communityData = await getCommunityData(currentUser?.id);

    if (communityData.announcements.length > 0) {
      return {
        memberName,
        announcements: communityData.announcements,
        groups: communityData.groups.length ? communityData.groups : undefined,
        threads: communityData.threads.length ? communityData.threads : undefined,
      };
    }
  } catch (error) {
    console.warn("Using community fallback data:", error);
  }

  return {
    memberName,
    announcements,
  };
}
