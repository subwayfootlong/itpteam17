import { getCommunityData } from "./community";
import { getCurrentUser } from "./currentUser";
import { announcements } from "./data/announcements";
import type { Announcement } from "./data/announcements";
import type { DiscussionGroup, DiscussionThread } from "./communityTypes";
import { isActiveMembership } from "./tierAccess";

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
    const communityData = await getCommunityData(currentUser);

    return {
      memberName,
      announcements: communityData.announcements,
      groups: communityData.groups,
      threads: communityData.threads,
    };
  } catch (error) {
    console.warn("Using community fallback data:", error);
  }

  return {
    memberName,
    announcements: isActiveMembership({
      membershipTier: currentUser?.membershipTier,
      membershipStatus: currentUser?.membershipStatus,
      expiryDate: currentUser?.expiryDate,
    })
      ? announcements
      : [],
    groups: [],
    threads: [],
  };
}
