import type { CommunityTab } from "./types";

export default function CommunityTabs({
  activeTab,
  onSelect,
}: {
  activeTab: CommunityTab;
  onSelect: (tab: CommunityTab) => void;
}) {
  return (
    <div className="community-tabs" role="tablist" aria-label="Community views">
      <button
        className={activeTab === "announcements" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("announcements")}
        role="tab"
        aria-selected={activeTab === "announcements"}
      >
        Announcements
      </button>
      <button
        className={activeTab === "discussions" ? "is-active" : ""}
        type="button"
        onClick={() => onSelect("discussions")}
        role="tab"
        aria-selected={activeTab === "discussions"}
      >
        Discussions
      </button>
    </div>
  );
}
