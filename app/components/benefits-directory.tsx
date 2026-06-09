"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type {
  MembershipBenefit,
  Partner,
  PartnerCategory,
  SingaporeRegion,
} from "../data/partners";

type ViewMode = "list" | "map";
type CategoryFilter = "All" | PartnerCategory;
type RegionFilter = "All locations" | SingaporeRegion | "Online";

const categories: CategoryFilter[] = [
  "All",
  "Books & Learning",
  "Lifestyle",
];

const regions: RegionFilter[] = [
  "All locations",
  "Central",
  "Online",
];

const categoryIcons: Record<PartnerCategory, string> = {
  "Books & Learning": "book",
  Lifestyle: "spark",
};

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
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
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    fork: (
      <>
        <path d="M6 3v8M3 3v5a3 3 0 0 0 6 0V3M6 11v10" />
        <path d="M16 3v18M16 3c4 2 5 7 0 10" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    spark: (
      <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
    ),
    close: (
      <>
        <path d="M18 6 6 18M6 6l12 12" />
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

function BrandMark() {
  return (
    <div className="brand">
      <Image
        className="brand-logo brand-logo--primary"
        src="/pergas-assets/pergas-logo-primary.png"
        width={250}
        height={50}
        alt="Pergas - Singapore Islamic Scholars and Religious Teachers Association"
        priority
      />
      <Image
        className="brand-logo brand-logo--secondary"
        src="/pergas-assets/pergas-logo-secondary.png"
        width={50}
        height={50}
        alt="Pergas"
        priority
      />
      <span>Member Portal</span>
    </div>
  );
}

function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <div
      className={`partner-logo partner-logo--${partner.category.toLowerCase()}`}
      aria-hidden="true"
    >
      <span>{partner.initials}</span>
    </div>
  );
}

function PartnerCard({
  partner,
  onSelect,
}: {
  partner: Partner;
  onSelect: (partner: Partner) => void;
}) {
  return (
    <article className="partner-card">
      <div className="partner-card__top">
        <PartnerLogo partner={partner} />
        <div className="partner-card__heading">
          <div className="tag-row">
            <span className="category-tag">
              <Icon name={categoryIcons[partner.category]} size={13} />
              {partner.category}
            </span>
            {partner.featured && <span className="featured-tag">Featured</span>}
          </div>
          <h3>{partner.name}</h3>
          <p className="offer">{partner.offer}</p>
        </div>
      </div>
      <p className="partner-description">{partner.description}</p>
      <div className="location-line">
        <Icon name="pin" size={16} />
        <span>{partner.address}</span>
        <span className="distance">{partner.distance}</span>
      </div>
      <button className="card-action" onClick={() => onSelect(partner)}>
        View benefit details
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}

function SingaporeMap({
  partners,
  selected,
  onSelect,
}: {
  partners: Partner[];
  selected: Partner | null;
  onSelect: (partner: Partner) => void;
}) {
  const mappedPartners = partners.filter(
    (
      partner,
    ): partner is Partner & { mapPosition: { x: number; y: number } } =>
      Boolean(partner.mapPosition),
  );

  return (
    <div className="map-panel">
      <div className="map-canvas">
        <div className="map-roads" aria-hidden="true">
          <span className="road road--1" />
          <span className="road road--2" />
          <span className="road road--3" />
          <span className="road road--4" />
          <span className="water water--1" />
          <span className="water water--2" />
        </div>
        <svg
          className="singapore-shape"
          viewBox="0 0 760 350"
          aria-label="Stylized map of Singapore"
          role="img"
        >
          <path
            d="M86 188c26-15 58-18 81-38 25-22 43-60 82-70 42-11 78 9 114 2 50-9 88-39 139-24 23 7 38 29 62 33 29 5 58-10 84 6 21 13 25 39 12 59-11 17-32 23-46 38-14 16-17 42-35 54-28 18-67 2-98 15-26 11-44 39-74 42-34 4-61-22-94-26-39-5-75 20-114 14-26-4-45-25-70-32-23-7-56-3-68-26-10-19 4-37 25-47Z"
            fill="currentColor"
          />
          <path
            d="M687 219c13-4 30 1 35 14 5 12-4 25-17 27-14 2-29-7-28-20 0-9 4-17 10-21ZM34 223c11-7 29-4 35 8 7 13-5 27-20 28-12 1-25-5-27-17-2-8 4-15 12-19Z"
            fill="currentColor"
          />
        </svg>
        <span className="map-label map-label--north">North</span>
        <span className="map-label map-label--west">West</span>
        <span className="map-label map-label--central">Central</span>
        <span className="map-label map-label--east">East</span>
        {mappedPartners.map((partner) => (
          <button
            key={partner.id}
            className={`map-pin ${selected?.id === partner.id ? "is-active" : ""}`}
            style={{
              left: `${partner.mapPosition.x}%`,
              top: `${partner.mapPosition.y}%`,
            }}
            onClick={() => onSelect(partner)}
            aria-label={`View ${partner.name}, ${partner.offer}`}
          >
            <Icon name={categoryIcons[partner.category]} size={16} />
          </button>
        ))}
        <div className="map-key">
          <span>
            <i />
            Partner location
          </span>
          <small>Illustrative Singapore map</small>
        </div>
      </div>
      <div className="map-results">
        <p>
          <strong>{mappedPartners.length}</strong>{" "}
          {mappedPartners.length === 1 ? "location" : "locations"} shown on map
        </p>
        <span>Online-only partners remain available in list view.</span>
      </div>
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
  const [region, setRegion] = useState<RegionFilter>("All locations");
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Partner | null>(null);

  const filteredPartners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          partner.name,
          partner.offer,
          partner.description,
          partner.address,
          partner.category,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesCategory =
        category === "All" || partner.category === category;
      const matchesRegion =
        region === "All locations" || partner.region === region;

      return matchesQuery && matchesCategory && matchesRegion;
    });
  }, [category, partners, query, region]);

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setRegion("All locations");
  };

  const choosePartner = (partner: Partner) => {
    setSelected(partner);
  };

  return (
    <div className="portal-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#">Home</a>
            <a href="#">Events</a>
            <a className="is-active" href="#" aria-current="page">
              Benefits
            </a>
            <a href="#">Community</a>
          </nav>
          <div className="member-actions">
            <button className="notification-button" aria-label="Notifications">
              <Icon name="bell" size={21} />
              <span />
            </button>
            <button className="member-profile">
              <span className="avatar">AK</span>
              <span className="member-copy">
                <strong>Ahmad Khalid</strong>
                <small>Active member</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-orb hero-orb--one" />
          <div className="hero-orb hero-orb--two" />
          <Image
            className="hero-floral"
            src="/pergas-assets/pergas-floral.png"
            width={476}
            height={473}
            alt=""
            aria-hidden="true"
          />
          <div className="page-container hero-content">
            <div>
              <span className="eyebrow">PERGAS MEMBERSHIP</span>
              <h1>Your benefits and privileges</h1>
              <p>
                Access member privileges and exclusive savings from Friends of
                Pergas, brought together in one official directory.
              </p>
            </div>
            <div className="hero-stat">
              <span>{membershipBenefits.length}</span>
              <p>
                membership privileges
                <small>for active members</small>
              </p>
            </div>
          </div>
        </section>

        <section className="membership-section">
          <div className="page-container">
            <div className="section-intro">
              <div>
                <span className="section-label">YOUR MEMBERSHIP</span>
                <h2>Benefits beyond partner discounts</h2>
              </div>
              <p>
                Your Pergas membership supports the development and welfare of
                Asatizah while giving you access to these official privileges.
              </p>
            </div>
            <div className="membership-grid">
              {membershipBenefits.map((benefit, index) => (
                <article className="membership-card" key={benefit.title}>
                  <span className="membership-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                    {benefit.ordinaryOnly && (
                      <small>Ordinary Member privilege</small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="page-container directory-section">
          <div className="directory-intro">
            <span className="section-label">FRIENDS OF PERGAS</span>
            <h2>Partner benefit directory</h2>
            <p>
              Browse the currently published offers available to active Pergas
              members.
            </p>
          </div>
          <div className="search-panel">
            <label className="search-field">
              <span className="sr-only">Search partner benefits</span>
              <Icon name="search" size={21} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search merchants, offers or locations"
              />
              {query && (
                <button
                  className="clear-search"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <Icon name="close" size={17} />
                </button>
              )}
            </label>
            <label className="region-select">
              <Icon name="pin" size={18} />
              <span className="sr-only">Filter by region</span>
              <select
                value={region}
                onChange={(event) =>
                  setRegion(event.target.value as RegionFilter)
                }
              >
                {regions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <Icon name="chevron" size={15} />
            </label>
          </div>

          <div className="toolbar">
            <div className="category-tabs" aria-label="Benefit categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "is-active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item !== "All" && (
                    <Icon
                      name={categoryIcons[item as PartnerCategory]}
                      size={15}
                    />
                  )}
                  {item === "All" ? "All benefits" : item}
                </button>
              ))}
            </div>
            <div className="view-toggle" aria-label="Choose directory view">
              <button
                className={view === "list" ? "is-active" : ""}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                <Icon name="list" size={17} />
                List
              </button>
              <button
                className={view === "map" ? "is-active" : ""}
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
              >
                <Icon name="map" size={17} />
                Map
              </button>
            </div>
          </div>

          <div className="results-heading" aria-live="polite">
            <div>
              <h2>
                {category === "All" ? "All published partner benefits" : category}
              </h2>
              <p>
                {filteredPartners.length}{" "}
                {filteredPartners.length === 1 ? "offer" : "offers"} available
                {region !== "All locations" ? ` in ${region}` : ""}
              </p>
            </div>
            {(query || category !== "All" || region !== "All locations") && (
              <button className="reset-button" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>

          {filteredPartners.length === 0 ? (
            <div className="empty-state">
              <span>
                <Icon name="search" size={28} />
              </span>
              <h3>No matching benefits found</h3>
              <p>Try a different search term or clear your filters.</p>
              <button onClick={resetFilters}>Show all benefits</button>
            </div>
          ) : view === "list" ? (
            <div className="partner-grid">
              {filteredPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  onSelect={choosePartner}
                />
              ))}
            </div>
          ) : (
            <SingaporeMap
              partners={filteredPartners}
              selected={selected}
              onSelect={choosePartner}
            />
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-container footer-inner">
          <BrandMark />
          <p>Exclusive benefits for Pergas members.</p>
          <span>Need help? <a href="mailto:support@pergas.org.sg">Contact support</a></span>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <a href="#">
          <Icon name="home" size={21} />
          Home
        </a>
        <a href="#">
          <Icon name="calendar" size={21} />
          Events
        </a>
        <a className="is-active" href="#" aria-current="page">
          <Icon name="card" size={21} />
          Benefits
        </a>
        <a href="#">
          <Icon name="user" size={21} />
          Profile
        </a>
      </nav>

      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelected(null);
          }}
        >
          <section
            className="benefit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benefit-title"
          >
            <button
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close benefit details"
            >
              <Icon name="close" size={20} />
            </button>
            <div className="modal-brand">
              <PartnerLogo partner={selected} />
              <span className="category-tag">
                <Icon
                  name={categoryIcons[selected.category]}
                  size={13}
                />
                {selected.category}
              </span>
            </div>
            <p className="modal-kicker">PERGAS MEMBER BENEFIT</p>
            <h2 id="benefit-title">{selected.offer}</h2>
            <h3>{selected.name}</h3>
            <p className="modal-description">{selected.description}</p>
            <div className="modal-location">
              <Icon name="pin" size={19} />
              <span>
                <strong>{selected.region} Singapore</strong>
                {selected.address}
              </span>
            </div>
            <div className="terms-box">
              <strong>How to redeem</strong>
              <p>{selected.terms}</p>
            </div>
            <a
              className="directions-button"
              href={
                selected.mapPosition
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selected.address,
                    )}`
                  : selected.website
              }
              target="_blank"
              rel="noreferrer"
            >
              {selected.mapPosition ? "Get directions" : "Visit partner website"}
              <Icon name="arrow" size={18} />
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
