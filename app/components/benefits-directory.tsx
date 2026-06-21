"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  MembershipBenefit,
  Partner,
  PartnerCategory,
} from "../data/partners";

type CategoryFilter = "All" | PartnerCategory;
type BenefitView = "list" | "map";

const categories: CategoryFilter[] = ["All", "Books & Learning", "Lifestyle"];

const categoryIcons: Record<PartnerCategory, string> = {
  "Books & Learning": "book",
  Lifestyle: "spark",
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <path d="m9 18 6-6-6-6" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.8 6.8-4.6M8.6 13.2l6.8 4.6" />
      </>
    ),
    spark: (
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function BenefitsHeader() {
  return (
    <header className="benefits-mobile-header">
      <div>
        <span className="benefits-member-avatar">AK</span>
        <h1>Pergas</h1>
      </div>
      <Link href="/notifications" aria-label="Notifications">
        <Icon name="bell" size={22} />
      </Link>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="benefits-bottom-nav" aria-label="Mobile navigation">
      <Link href="/benefit">
        <Icon name="home" size={22} />
        Home
      </Link>
      <a href="#">
        <Icon name="calendar" size={22} />
        Events
      </a>
      <Link className="is-active" href="/benefit" aria-current="page">
        <Icon name="card" size={22} />
        Benefits
      </Link>
      <Link href="/announcements">
        <Icon name="message" size={22} />
        Community
      </Link>
      <a href="#">
        <Icon name="user" size={22} />
        Profile
      </a>
    </nav>
  );
}

function MembershipSummary({
  membershipBenefits,
}: {
  membershipBenefits: MembershipBenefit[];
}) {
  const shownBenefits = membershipBenefits.slice(0, 4);

  return (
    <section className="benefits-pass-card">
      <div>
        <span>Associate Member</span>
        <strong>Ahmad Khalid</strong>
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
      className={`benefit-partner-visual benefit-partner-visual--${partner.category === "Lifestyle" ? "lifestyle" : "books"}`}
      aria-hidden="true"
    >
      <span>{partner.initials}</span>
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
            <Icon name={categoryIcons[partner.category]} size={15} />
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
            <Icon name="share" size={19} />
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
          <Icon name="map" size={28} />
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
            <Icon name="pin" size={18} />
          </button>
        ))}
      </div>
      <div className="benefits-map-results">
        <strong>{mappedPartners.length} partner locations</strong>
        <p>Online rewards remain available from the rewards list.</p>
      </div>
      {selected && (
        <RewardCard partner={selected} onSelect={onRedeem} />
      )}
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
          <Icon name="close" size={20} />
        </button>
        <PartnerVisual partner={partner} />
        <span className="benefits-sheet-kicker">Pergas Member Reward</span>
        <h2 id="benefit-title">{partner.offer}</h2>
        <h3>{partner.name}</h3>
        <p>{partner.description}</p>
        <div className="benefits-location-box">
          <Icon name="pin" size={20} />
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
          <Icon name="arrow" size={18} />
        </a>
      </section>
    </div>
  );
}

export default function BenefitsDirectory({
  partners,
  membershipBenefits,
}: {
  partners: Partner[];
  membershipBenefits: MembershipBenefit[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [view, setView] = useState<BenefitView>("list");
  const [mapSelected, setMapSelected] = useState<Partner | null>(null);
  const [redeemPartner, setRedeemPartner] = useState<Partner | null>(null);

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

  return (
    <div className="benefits-mobile-shell">
      <BenefitsHeader />

      <main className="benefits-mobile-main">
        <section className="benefits-intro">
          <h2>Member Benefits</h2>
          <p>Access rewards, partner discounts, and active member privileges.</p>
        </section>

        <MembershipSummary membershipBenefits={membershipBenefits} />

        <label className="benefits-search">
          <span className="sr-only">Search benefits</span>
          <Icon name="search" size={22} />
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
              <Icon name="close" size={17} />
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
            <Icon name="search" size={28} />
            <h2>No benefits found</h2>
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
      </main>

      <BottomNav />

      {redeemPartner && (
        <BenefitModal
          partner={redeemPartner}
          onClose={() => setRedeemPartner(null)}
        />
      )}
    </div>
  );
}
