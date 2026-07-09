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

function hasPhysicalLocation(partner: Partner) {
  const address = partner.address.trim().toLowerCase();
  return (
    partner.region !== "Online" &&
    Boolean(address) &&
    !address.includes("online") &&
    !address.includes("merchant-confirmed")
  );
}

function googleMapsQuery(partner: Partner) {
  return `${partner.name}, ${partner.address}, Singapore`;
}

function googleMapsEmbedUrl(partner: Partner) {
  return `https://www.google.com/maps?q=${encodeURIComponent(
    googleMapsQuery(partner),
  )}&output=embed`;
}

function googleMapsSearchUrl(partner: Partner) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    googleMapsQuery(partner),
  )}`;
}

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
  const mappedPartners = partners.filter(hasPhysicalLocation);
  const previewPartner = mappedPartners[0];

  return (
    <section className="benefits-map-preview">
      <div>
        <span>Partners Near You</span>
        <strong>{mappedPartners.length} nearby locations</strong>
      </div>
      <div
        className={`benefits-mini-map ${
          previewPartner ? "benefits-mini-map--google" : "benefits-mini-map--empty"
        }`}
      >
        {previewPartner ? (
          <iframe
            className="benefits-google-map-frame"
            title={`${previewPartner.name} map preview`}
            src={googleMapsEmbedUrl(previewPartner)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <p>No partner address yet</p>
        )}
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
  const mappedPartners = partners.filter(hasPhysicalLocation);
  const activePartner =
    mappedPartners.find((partner) => partner.id === selected?.id) ??
    mappedPartners[0] ??
    null;

  if (mappedPartners.length === 0) {
    return (
      <section className="benefits-map-screen">
        <div className="benefits-empty-state">
          <MemberIcon name="map" size={28} />
          <h2>No map locations</h2>
          <p>Benefits with admin-entered physical addresses will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="benefits-map-screen">
      {activePartner && (
        <div className="benefits-map-canvas benefits-map-canvas--google">
          <iframe
            className="benefits-google-map-frame"
            title={`${activePartner.name} location map`}
            src={googleMapsEmbedUrl(activePartner)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
      <div className="benefits-map-results">
        <div>
          <strong>{mappedPartners.length} partner locations</strong>
          <p>Choose a partner to preview its Google Maps location.</p>
        </div>
        {activePartner && (
          <a
            href={googleMapsSearchUrl(activePartner)}
            target="_blank"
            rel="noreferrer"
          >
            Open Maps
            <MemberIcon name="arrow" size={15} />
          </a>
        )}
      </div>
      <div className="benefits-map-location-list">
        {mappedPartners.map((partner) => (
          <button
            key={partner.id}
            className={activePartner?.id === partner.id ? "is-active" : ""}
            type="button"
            onClick={() => onSelect(partner)}
            aria-label={`Open ${partner.name}`}
          >
            <MemberIcon name="pin" size={18} />
            <span>
              <strong>{partner.name}</strong>
              <small>{partner.address}</small>
            </span>
          </button>
        ))}
      </div>
      {activePartner && <RewardCard partner={activePartner} onSelect={onRedeem} />}
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
            hasPhysicalLocation(partner)
              ? googleMapsSearchUrl(partner)
              : partner.website
          }
          target="_blank"
          rel="noreferrer"
        >
          {hasPhysicalLocation(partner) ? "Get Directions" : "Visit Partner Website"}
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
