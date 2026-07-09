"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import type {
  MembershipBenefit,
  Partner,
  PartnerCategory,
} from "@/lib/data/partners";
import MemberIcon from "@/components/member/MemberIcon";
import MemberBottomNav from "@/components/MemberBottomNav";

type CategoryFilter = "All" | PartnerCategory;
type BenefitView = "list" | "map";

const categories: CategoryFilter[] = ["All", "Books & Learning", "Lifestyle"];

const categoryIcons: Record<PartnerCategory, string> = {
  "Books & Learning": "book",
  Lifestyle: "spark",
};

type MemberSummary = {
  firstName: string;
  lastName: string;
  membershipTierLabel: string;
  initials: string;
};

function BenefitsHeader({ initials }: { initials: string }) {
  return (
    <header className="benefits-mobile-header">
      <div>
        <span className="benefits-member-avatar">{initials}</span>
        <h1>Pergas</h1>
      </div>
      <Link href="/member/notifications" aria-label="Notifications">
        <MemberIcon name="bell" size={22} />
      </Link>
    </header>
  );
}

function MembershipSummary({
  membershipBenefits,
  member,
}: {
  membershipBenefits: MembershipBenefit[];
  member: MemberSummary;
}) {
  const shownBenefits = membershipBenefits.slice(0, 4);
  const displayName = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="benefits-pass-card">
      <div>
        <span>{member.membershipTierLabel} Member</span>
        <strong>{displayName || "Member"}</strong>
        <small>Active privileges available</small>
      </div>
      <p>{membershipBenefits.length}</p>
      <ul aria-label="Active member privileges">
        {shownBenefits.map((benefit) => (
          <li key={benefit.title}>{benefit.title}</li>
        ))}
      </ul>
    </section>
  );
}

function PartnerMapPreview({
  partners,
  onOpenMap,
}: {
  partners: Partner[];
  onOpenMap: () => void;
}) {
  const mappedPartners = partners.filter((partner) => partner.mapPosition);

  return (
    <section className="benefits-map-preview">
      <div>
        <span>Partners Near You</span>
        <strong>{mappedPartners.length} nearby locations</strong>
      </div>
      <div className="benefits-mini-map" aria-hidden="true">
        {mappedPartners.map((partner) => (
          <i
            key={partner.id}
            style={{
              left: `${partner.mapPosition?.x ?? 50}%`,
              top: `${partner.mapPosition?.y ?? 50}%`,
            }}
          />
        ))}
      </div>
      <button type="button" onClick={onOpenMap}>
        View Partner Map
      </button>
    </section>
  );
}

function CategoryTabs({
  selected,
  onSelect,
}: {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}) {
  return (
    <div className="benefits-filter-tabs" aria-label="Benefit categories">
      {categories.map((category) => (
        <button
          key={category}
          className={selected === category ? "is-active" : ""}
          type="button"
          onClick={() => onSelect(category)}
        >
          {category === "All" ? "All" : category.replace(" & Learning", "")}
        </button>
      ))}
    </div>
  );
}

function PartnerVisual({ partner }: { partner: Partner }) {
  return (
    <div
      className={`benefit-partner-visual benefit-partner-visual--${partner.category === "Lifestyle" ? "lifestyle" : "books"} ${partner.imageUrl ? "has-image" : ""}`}
      aria-hidden="true"
    >
      {partner.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="benefit-partner-visual__image"
          src={partner.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      )}
      <span className={partner.logoUrl ? "has-logo" : ""}>
        {partner.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.logoUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          partner.initials
        )}
      </span>
      {partner.featured && <em>NEW</em>}
    </div>
  );
}

function RewardCard({
  partner,
  onSelect,
}: {
  partner: Partner;
  onSelect: (partner: Partner) => void;
}) {
  return (
    <article className="benefit-reward-card">
      <PartnerVisual partner={partner} />
      <div className="benefit-reward-card__body">
        <div className="benefit-reward-card__meta">
          <span>
            <MemberIcon name={categoryIcons[partner.category]} size={15} />
            {partner.category}
          </span>
          <small>{partner.distance}</small>
        </div>
        <h2>{partner.name}</h2>
        <p>{partner.offer}</p>
        <div className="benefit-reward-card__actions">
          <button type="button" onClick={() => onSelect(partner)}>
            Claim Reward
          </button>
          <button type="button" aria-label={`Share ${partner.name}`}>
            <MemberIcon name="share" size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}

function PartnerMap({
  partners,
  selected,
  onSelect,
  onRedeem,
}: {
  partners: Partner[];
  selected: Partner | null;
  onSelect: (partner: Partner) => void;
  onRedeem: (partner: Partner) => void;
}) {
  const mappedPartners = partners.filter(
    (
      partner,
    ): partner is Partner & { mapPosition: { x: number; y: number } } =>
      Boolean(partner.mapPosition),
  );

  if (mappedPartners.length === 0) {
    return (
      <section className="benefits-map-screen">
        <div className="benefits-map-canvas">
          <svg viewBox="0 0 760 350" aria-label="Stylized Singapore partner map">
            <path d="M86 188c26-15 58-18 81-38 25-22 43-60 82-70 42-11 78 9 114 2 50-9 88-39 139-24 23 7 38 29 62 33 29 5 58-10 84 6 21 13 25 39 12 59-11 17-32 23-46 38-14 16-17 42-35 54-28 18-67 2-98 15-26 11-44 39-74 42-34 4-61-22-94-26-39-5-75 20-114 14-26-4-45-25-70-32-23-7-56-3-68-26-10-19 4-37 25-47Z" />
            <path d="M687 219c13-4 30 1 35 14 5 12-4 25-17 27-14 2-29-7-28-20 0-9 4-17 10-21ZM34 223c11-7 29-4 35 8 7 13-5 27-20 28-12 1-25-5-27-17-2-8 4-15 12-19Z" />
          </svg>
        </div>
        <div className="benefits-empty-state">
          <MemberIcon name="map" size={28} />
          <h2>No map locations</h2>
          <p>Try another category or search term to show partner pins.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="benefits-map-screen">
      <div className="benefits-map-canvas">
        <svg viewBox="0 0 760 350" aria-label="Stylized Singapore partner map">
          <path d="M86 188c26-15 58-18 81-38 25-22 43-60 82-70 42-11 78 9 114 2 50-9 88-39 139-24 23 7 38 29 62 33 29 5 58-10 84 6 21 13 25 39 12 59-11 17-32 23-46 38-14 16-17 42-35 54-28 18-67 2-98 15-26 11-44 39-74 42-34 4-61-22-94-26-39-5-75 20-114 14-26-4-45-25-70-32-23-7-56-3-68-26-10-19 4-37 25-47Z" />
          <path d="M687 219c13-4 30 1 35 14 5 12-4 25-17 27-14 2-29-7-28-20 0-9 4-17 10-21ZM34 223c11-7 29-4 35 8 7 13-5 27-20 28-12 1-25-5-27-17-2-8 4-15 12-19Z" />
        </svg>
        {mappedPartners.map((partner) => (
          <button
            key={partner.id}
            className={selected?.id === partner.id ? "is-active" : ""}
            style={{
              left: `${partner.mapPosition.x}%`,
              top: `${partner.mapPosition.y}%`,
            }}
            type="button"
            onClick={() => onSelect(partner)}
            aria-label={`Open ${partner.name}`}
          >
            <MemberIcon name="pin" size={18} />
          </button>
        ))}
      </div>
      <div className="benefits-map-results">
        <strong>{mappedPartners.length} partner locations</strong>
        <p>Online rewards remain available from the rewards list.</p>
      </div>
      {selected && <RewardCard partner={selected} onSelect={onRedeem} />}
    </section>
  );
}

function BenefitModal({
  partner,
  onClose,
}: {
  partner: Partner;
  onClose: () => void;
}) {
  return (
    <div
      className="benefits-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="benefits-redeem-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-title"
      >
        <button type="button" onClick={onClose} aria-label="Close">
          <MemberIcon name="close" size={20} />
        </button>
        <PartnerVisual partner={partner} />
        <span className="benefits-sheet-kicker">Pergas Member Reward</span>
        <h2 id="benefit-title">{partner.offer}</h2>
        <h3>{partner.name}</h3>
        <p>{partner.description}</p>
        <div className="benefits-location-box">
          <MemberIcon name="pin" size={20} />
          <span>
            <strong>{partner.region} Singapore</strong>
            {partner.address}
          </span>
        </div>
        <div className="benefits-terms-box">
          <strong>How to redeem</strong>
          <p>{partner.terms}</p>
        </div>
        <a
          href={
            partner.mapPosition
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  partner.address,
                )}`
              : partner.website
          }
          target="_blank"
          rel="noreferrer"
        >
          {partner.mapPosition ? "Get Directions" : "Visit Partner Website"}
          <MemberIcon name="arrow" size={18} />
        </a>
      </section>
    </div>
  );
}

export default function BenefitsDirectory({
  partners,
  membershipBenefits,
  showChrome = true,
  member = {
    firstName: "",
    lastName: "",
    membershipTierLabel: "Member",
    initials: "M",
  },
}: {
  partners: Partner[];
  membershipBenefits: MembershipBenefit[];
  showChrome?: boolean;
  member?: MemberSummary;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [view, setView] = useState<BenefitView>("list");
  const [mapSelected, setMapSelected] = useState<Partner | null>(null);
  const [redeemPartner, setRedeemPartnerState] = useState<Partner | null>(null);

  const setRedeemPartner = useCallback((partner: Partner | null) => {
    setRedeemPartnerState(partner);
    if (partner) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "benefit_view",
          targetId: partner.id,
          category: "benefit",
          metadata: { name: partner.name, offer: partner.offer },
        }),
      }).catch((err) => console.warn("Failed tracking benefit view", err));
    }
  }, []);

  const filteredPartners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesCategory =
        category === "All" || partner.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [
          partner.name,
          partner.offer,
          partner.description,
          partner.address,
          partner.category,
          partner.region,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [category, partners, query]);

  const visibleMapSelected =
    filteredPartners.find((partner) => partner.id === mapSelected?.id) ?? null;
  const hasBenefits = partners.length > 0;
  const shellClassName = showChrome
    ? "benefits-mobile-shell"
    : "benefits-mobile-shell is-member-embedded";

  return (
    <div className={shellClassName}>
      {showChrome && <BenefitsHeader initials={member.initials} />}

      <main className="benefits-mobile-main">
        <section className="benefits-intro">
          <h2>Member Benefits</h2>
          <p>Access rewards, partner discounts, and active member privileges.</p>
        </section>

        <MembershipSummary
          membershipBenefits={membershipBenefits}
          member={member}
        />

        {!hasBenefits ? (
          <section className="benefits-empty-state benefits-empty-state--primary">
            <MemberIcon name="spark" size={30} />
            <h2>Currently there are no benefits</h2>
            <p>New partner rewards will appear here once they are published by admin.</p>
          </section>
        ) : (
          <>
            <label className="benefits-search">
              <span className="sr-only">Search benefits</span>
              <MemberIcon name="search" size={22} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rewards or partners..."
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <MemberIcon name="close" size={17} />
                </button>
              )}
            </label>

            <PartnerMapPreview partners={partners} onOpenMap={() => setView("map")} />

            <div className="benefits-view-toggle" aria-label="Benefit view">
              <button
                className={view === "list" ? "is-active" : ""}
                type="button"
                onClick={() => setView("list")}
              >
                Rewards
              </button>
              <button
                className={view === "map" ? "is-active" : ""}
                type="button"
                onClick={() => setView("map")}
              >
                Map
              </button>
            </div>

            <CategoryTabs selected={category} onSelect={setCategory} />

            <section className="benefits-results-heading" aria-live="polite">
              <div>
                <span>Featured Rewards</span>
                <strong>{filteredPartners.length} available</strong>
              </div>
              {category !== "All" || query ? (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("All");
                    setQuery("");
                  }}
                >
                  Reset
                </button>
              ) : null}
            </section>

            {view === "map" ? (
              <PartnerMap
                partners={filteredPartners}
                selected={visibleMapSelected}
                onSelect={setMapSelected}
                onRedeem={setRedeemPartner}
              />
            ) : filteredPartners.length > 0 ? (
              <section className="benefit-reward-list">
                {filteredPartners.map((partner) => (
                  <RewardCard
                    key={partner.id}
                    partner={partner}
                    onSelect={setRedeemPartner}
                  />
                ))}
              </section>
            ) : (
              <section className="benefits-empty-state">
                <MemberIcon name="search" size={28} />
                <h2>No matching benefits</h2>
                <p>Try another search or show all rewards.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                >
                  Show All Rewards
                </button>
              </section>
            )}
          </>
        )}
      </main>

      {showChrome && <MemberBottomNav />}

      {redeemPartner && (
        <BenefitModal
          partner={redeemPartner}
          onClose={() => setRedeemPartner(null)}
        />
      )}
    </div>
  );
}
