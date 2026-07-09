"use client";

import { useMemo, useState, useCallback } from "react";
import type { Announcement, CommunityComment } from "@/lib/data/announcements";
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
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(
    initialThreads.find((thread) => thread.groupId === initialGroupId)?.id ??
      initialThreads[0]?.id ??
      null,
  );
  const [moderatorNotice, setModeratorNotice] = useState(false);
  const [announcementComments, setAnnouncementComments] = useState<
    Record<string, CommunityComment[]>
  >({});
  const [threadComments, setThreadComments] = useState<
    Record<string, CommunityComment[]>
  >({});

  const selectedAnnouncement = useMemo(
    () =>
      announcements.find(
        (announcement) => announcement.id === selectedAnnouncementId,
      ),
    [announcements, selectedAnnouncementId],
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

  const handleThreadComment = async (threadId: string, body: string) => {
    let comment = makePendingComment(
      body,
      (threadComments[threadId] ?? []).length + 1,
      memberName,
    );

    try {
      const response = await postJson<CommentResponse>(
        "/api/community/thread-comments",
        { threadId, body },
      );
      comment = response.comment;
    } catch (error) {
      console.warn("Saved thread comment locally:", error);
    }

    setThreadComments((current) => ({
      ...current,
      [threadId]: [...(current[threadId] ?? []), comment],
    }));
    setExpandedThreadId(threadId);
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
        <div className="community-inline-heading">
          {canGoBack ? (
            <button type="button" onClick={handleBack} aria-label="Go back">
              <MemberIcon name="back" size={22} />
            </button>
          ) : (
            <span aria-hidden="true">
              <MemberIcon name="message" size={22} />
            </span>
          )}
          <div>
            <h2>{pageTitle === "Pergas" ? "Community" : pageTitle}</h2>
            {!canGoBack && <p>Announcements and member discussions</p>}
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
          />
        ) : selectedGroupId ? (
          <DiscussionFeed
            groupId={selectedGroupId}
            groups={groups}
            threads={threads}
            localComments={threadComments}
            expandedThreadId={expandedThreadId}
            onExpandThread={(threadId) =>
              setExpandedThreadId((current) =>
                current === threadId ? null : threadId,
              )
            }
            onComment={handleThreadComment}
          />
        ) : activeTab === "announcements" ? (
          <AnnouncementList
            announcements={announcements}
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
