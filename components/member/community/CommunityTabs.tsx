import type { CommunityTab } from "./types";

const tabs: { id: CommunityTab; label: string }[] = [
  { id: "announcements", label: "Announcements" },
  { id: "discussions", label: "Discussions" },
];

export default function CommunityTabs({
  activeTab,
  onSelect,
}: {
  activeTab: CommunityTab;
  onSelect: (tab: CommunityTab) => void;
}) {
  return (
    <div
      className="mx-4 mt-4 grid grid-cols-2 rounded-2xl border border-stone-200/60 bg-stone-100 p-1"
      role="tablist"
      aria-label="Community views"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={`rounded-xl py-2.5 text-xs font-bold transition-all duration-100 active:scale-[0.98] ${
              isActive
                ? "bg-white text-brand-primary-800 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
