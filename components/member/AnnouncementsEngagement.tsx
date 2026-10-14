"use client";

import { useMemo, useState, useCallback } from "react";
import type {
  Announcement,
  CommunityComment,
  PollCounts,
  PollResponseValue,
} from "@/lib/data/announcements";
import type {
  DiscussionGroup,
  DiscussionGroupId,
  DiscussionThread,
} from "@/lib/communityTypes";
import MemberIcon from "@/components/member/MemberIcon";
import MobileHeader from "./community/MobileHeader";
import CommunityTabs from "./community/CommunityTabs";
import CommunityBottomNav from "./community/CommunityBottomNav";
import AnnouncementList from "./community/AnnouncementList";
import AnnouncementDetail from "./community/AnnouncementDetail";
import DiscussionGroups from "./community/DiscussionGroups";
import DiscussionFeed from "./community/DiscussionFeed";
import type { CommentResponse, CommunityTab } from "./community/types";
import {
  makePendingComment,
  postJson,
} from "./community/utils";

export default function AnnouncementsEngagement({
  announcements,
  groups = [],
  threads: initialThreads = [],
  showChrome = true,
  memberName = "Member",
  initialTab = "announcements",
  initialGroupId = null,
}: {
  announcements: Announcement[];
  groups?: DiscussionGroup[];
  threads?: DiscussionThread[];
  showChrome?: boolean;
  memberName?: string;
  initialTab?: CommunityTab;
  initialGroupId?: DiscussionGroupId | null;
}) {
  const [activeTab, setActiveTab] = useState<CommunityTab>(initialTab);
  const [selectedAnnouncementId, setSelectedAnnouncementIdState] = useState<
    string | null
  >(null);

  const setSelectedAnnouncementId = useCallback((id: string | null) => {
    setSelectedAnnouncementIdState(id);
    if (id) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "announcement_view",
          targetId: id,
          category: "announcement",
        }),
      }).catch((err) => console.warn("Failed tracking announcement view", err));
    }
  }, []);
  const [selectedGroupId, setSelectedGroupId] =
    useState<DiscussionGroupId | null>(initialGroupId);
  const [threads] = useState(initialThreads);
  const [moderatorNotice, setModeratorNotice] = useState(false);
  const [announcementComments, setAnnouncementComments] = useState<
    Record<string, CommunityComment[]>
  >({});
  const [pollOverrides, setPollOverrides] = useState<
    Record<string, { response: PollResponseValue; counts: PollCounts }>
  >({});

  const announcementsWithPolls = useMemo(
    () =>
      announcements.map((announcement) => {
        const override = pollOverrides[announcement.id];
        if (!override) return announcement;
        return {
          ...announcement,
          myPollResponse: override.response,
          pollCounts: override.counts,
        };
      }),
    [announcements, pollOverrides],
  );

  const selectedAnnouncement = useMemo(
    () =>
      announcementsWithPolls.find(
        (announcement) => announcement.id === selectedAnnouncementId,
      ),
    [announcementsWithPolls, selectedAnnouncementId],
  );

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const pageTitle = selectedAnnouncement
    ? "Announcement"
    : selectedGroup
      ? selectedGroup.title
      : "Pergas";

  const canGoBack = Boolean(selectedAnnouncement || selectedGroupId);
  const shellClassName = showChrome
    ? "community-app-shell"
    : "community-app-shell is-member-embedded";

  const handleBack = () => {
    if (selectedAnnouncement) {
      setSelectedAnnouncementId(null);
      return;
    }

    setSelectedGroupId(null);
  };

  const handleSelectTab = (tab: CommunityTab) => {
    setActiveTab(tab);
    setSelectedAnnouncementId(null);
    setSelectedGroupId(null);
  };

  const handleAnnouncementComment = async (
    announcementId: string,
    body: string,
  ) => {
    let comment = makePendingComment(
      body,
      (announcementComments[announcementId] ?? []).length + 1,
      memberName,
    );

    try {
      const response = await postJson<CommentResponse>(
        "/api/community/announcement-comments",
        { announcementId, body },
      );
      comment = response.comment;
    } catch (error) {
      console.warn("Saved announcement comment locally:", error);
    }

    setAnnouncementComments((current) => ({
      ...current,
      [announcementId]: [...(current[announcementId] ?? []), comment],
    }));
  };

  const handlePollVote = async (
    announcementId: string,
    response: PollResponseValue,
  ) => {
    try {
      const result = await postJson<{ response: PollResponseValue; counts: PollCounts }>(
        "/api/community/announcement-poll",
        { announcementId, response },
      );
      setPollOverrides((current) => ({
        ...current,
        [announcementId]: { response: result.response, counts: result.counts },
      }));
    } catch (error) {
      console.warn("Unable to record poll response:", error);
    }
  };

  return (
    <div className={shellClassName}>
      {showChrome && (
        <MobileHeader
          title={pageTitle}
          canGoBack={canGoBack}
          onBack={handleBack}
        />
      )}
      {!showChrome && (
        <div className="flex items-center gap-3 px-4 pt-5">
          {canGoBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-brand-primary-800 shadow-xs transition-transform duration-100 active:scale-95"
            >
              <MemberIcon name="back" size={20} />
            </button>
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800"
            >
              <MemberIcon name="message" size={20} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate font-butler text-xl font-semibold leading-tight text-neutral-900">
              {pageTitle === "Pergas" ? "Community" : pageTitle}
            </h2>
            {!canGoBack && (
              <p className="text-xs text-neutral-500">
                Announcements and member discussions
              </p>
            )}
          </div>
        </div>
      )}
      {!selectedAnnouncement && !selectedGroupId && (
        <CommunityTabs activeTab={activeTab} onSelect={handleSelectTab} />
      )}

      <main className="community-main">
        {selectedAnnouncement ? (
          <AnnouncementDetail
            announcement={selectedAnnouncement}
            localComments={announcementComments[selectedAnnouncement.id] ?? []}
            onComment={handleAnnouncementComment}
            onVote={handlePollVote}
          />
        ) : selectedGroupId ? (
          <DiscussionFeed
            groupId={selectedGroupId}
            groups={groups}
            threads={threads}
          />
        ) : activeTab === "announcements" ? (
          <AnnouncementList
            announcements={announcementsWithPolls}
            onOpen={setSelectedAnnouncementId}
          />
        ) : (
          <DiscussionGroups
            groups={groups}
            onOpenGroup={setSelectedGroupId}
            moderatorNotice={moderatorNotice}
            onContactModerator={() => setModeratorNotice(true)}
          />
        )}
      </main>
      {showChrome && <CommunityBottomNav />}
    </div>
  );
}
