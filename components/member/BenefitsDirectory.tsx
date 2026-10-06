"use client";

import Link from "next/link";
import { useMemo, useState, useCallback } from "react";
import { Lock, Search, X } from "lucide-react";
import type { Partner } from "@/lib/data/partners";
import MemberIcon from "@/components/member/MemberIcon";
import MemberBottomNav from "@/components/MemberBottomNav";

type CategoryFilter = "All" | string;
type BenefitView = "list" | "map";

function hasPhysicalLocation(partner: Partner) {
  if (partner.isLocked) return false;
  const address = partner.address.trim().toLowerCase();
  return (
    partner.region !== "Online" &&
    Boolean(address) &&
    !address.includes("online") &&
    !address.includes("merchant-confirmed")
  );
}

function googleMapsQuery(partner: Partner) {
  return `${partner.name}, ${partner.address}`;
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
  partners,
  member,
}: {
  partners: Partner[];
  member: MemberSummary;
}) {
  const displayName = [member.firstName, member.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-brand-primary-800 via-brand-primary-700 to-brand-primary-900 p-4 text-white shadow-md">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary-100">
          {member.membershipTierLabel} Member
        </p>
        <p className="mt-0.5 truncate text-base font-bold">
          {displayName || "Member"}
        </p>
        <p className="mt-0.5 text-xs text-brand-primary-100">
          Active privileges available
        </p>
      </div>
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/15">
        <span className="text-lg font-bold leading-none">{partners.length}</span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">
          Perks
        </span>
      </div>
    </section>
  );
}

function FeaturedMerchantBanner({
  partners,
  onOpenMap,
}: {
  partners: Partner[];
  onOpenMap: () => void;
}) {
  const mappedPartners = partners.filter(hasPhysicalLocation);
  const mappedCount = mappedPartners.length;
  const previewPartner = mappedPartners[0];

  return (
    <section className="mb-5 grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-4 rounded-2xl border border-brand-primary-100 bg-brand-primary-50 p-4">
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-neutral-900">Partners near you</h3>
        <p className="mt-1 text-xs text-neutral-600">
          {mappedCount > 0
            ? `${mappedCount} partner ${
                mappedCount === 1 ? "location" : "locations"
              } offering member privileges.`
            : "Partner locations will appear here once addresses are published."}
        </p>
        {mappedCount > 0 && (
          <button
            type="button"
            onClick={onOpenMap}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-primary-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
          >
            <MemberIcon name="pin" size={14} />
            View Partner Map
          </button>
        )}
      </div>

      {/* Map tile with a stacked offset shadow for a raised, 3D look */}
      <div className="relative h-28 w-28 justify-self-center [transform:perspective(500px)_rotateY(-14deg)_rotateX(6deg)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-2 translate-y-2.5 rounded-2xl bg-brand-primary-900/30 blur-[2px]"
        />
        <div className="relative h-full w-full overflow-hidden rounded-2xl border-[3px] border-white bg-brand-primary-100 shadow-[0_14px_22px_-8px_rgba(23,63,20,0.55)]">
          {previewPartner ? (
            <iframe
              title={`${previewPartner.name} map preview`}
              src={googleMapsEmbedUrl(previewPartner)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
              className="pointer-events-none h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary-100 to-brand-primary-200 text-brand-primary-800">
              <MemberIcon name="pin" size={28} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryChips({
  categories,
  selected,
  onSelect,
}: {
  categories: CategoryFilter[];
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}) {
  return (
    <div
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2"
      role="group"
      aria-label="Benefit categories"
    >
      {categories.map((category) => {
        const isActive = selected === category;

        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(category)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-100 active:scale-95 ${
              isActive
                ? "bg-brand-primary-800 text-white shadow-sm"
                : "border border-neutral-300 bg-white text-neutral-700 shadow-xs hover:border-brand-primary-600 hover:text-brand-primary-800"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

function PartnerVisual({ partner }: { partner: Partner }) {
  return (
    <div
      className={`benefit-partner-visual ${partner.imageUrl ? "has-image" : ""}`}
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
    </div>
  );
}

function discountLabel(offer: string) {
  const match = offer.match(/(\d+(?:\.\d+)?\s?%|\$\s?\d+(?:\.\d+)?)/);
  return match ? `${match[1].replace(/\s/g, "")} off` : null;
}

function RewardCard({
  partner,
  onSelect,
}: {
  partner: Partner;
  onSelect: (partner: Partner) => void;
}) {
  const discount = discountLabel(partner.offer);
  const lockedLabel = partner.requiredTierLabels?.length
    ? `Available to ${partner.requiredTierLabels.join(" / ")} members`
    : "Tier-restricted reward";

  return (
    <article className="mb-4 flex flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-100">
        {partner.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`h-full w-full object-cover object-center ${
              partner.isLocked ? "opacity-80" : ""
            }`}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-primary-800 to-brand-primary-900 text-3xl font-bold tracking-wide text-white/90"
          >
            {partner.initials}
          </div>
        )}
        {discount && (
          <span className="absolute right-3 top-3 rounded-full border border-brand-accent/60 bg-brand-accent-soft px-2.5 py-1 text-xs font-bold text-amber-900 shadow-xs">
            {discount}
          </span>
        )}
      </div>

      <div className="flex flex-col p-4">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary-100 text-xs font-bold text-brand-primary-800">
            {partner.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={partner.logoUrl}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              partner.initials
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-neutral-700">
              {partner.name}
            </p>
            <span className="mt-0.5 inline-block rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
              {partner.category}
            </span>
          </div>
          {partner.distance && (
            <span className="shrink-0 text-[11px] text-neutral-500">
              {partner.distance}
            </span>
          )}
        </div>

        <h2 className="mt-1 text-base font-semibold text-neutral-900">
          {partner.offer}
        </h2>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
          {partner.description}
        </p>

        {partner.isLocked ? (
          <span className="mt-3 inline-flex items-center gap-1.5 self-start rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs text-neutral-500">
            <Lock size={13} aria-hidden="true" />
            {lockedLabel}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(partner)}
            className="mt-3 min-h-11 w-full rounded-xl bg-brand-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-100 hover:bg-brand-primary-900 active:scale-[0.98]"
          >
            Claim Reward
          </button>
        )}
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
      <section className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-100 text-brand-primary-800">
          <MemberIcon name="map" size={24} />
        </span>
        <h2 className="mt-3 text-base font-semibold text-neutral-900">
          No map locations
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Benefits with admin-entered physical addresses will appear here.
        </p>
      </section>
    );
  }

  return (
    <section>
      {activePartner && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-brand-primary-50 shadow-md">
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            title={`${activePartner.name} location map`}
            src={googleMapsEmbedUrl(activePartner)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <div className="mb-3 mt-4 flex items-center justify-between gap-3">
        <div>
          <strong className="block text-sm font-semibold text-neutral-900">
            {mappedPartners.length} partner{" "}
            {mappedPartners.length === 1 ? "location" : "locations"}
          </strong>
          <p className="text-xs text-neutral-500">
            Tap a partner to preview its location.
          </p>
        </div>
        {activePartner && (
          <a
            href={googleMapsSearchUrl(activePartner)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-primary-800 px-3.5 py-1.5 text-xs font-semibold text-brand-primary-800 transition-transform duration-100 hover:bg-brand-primary-50 active:scale-95"
          >
            Open Maps
            <MemberIcon name="arrow" size={14} />
          </a>
        )}
      </div>

      <ul className="space-y-2.5">
        {mappedPartners.map((partner) => {
          const isActive = activePartner?.id === partner.id;

          return (
            <li key={partner.id}>
              <button
                type="button"
                onClick={() => onSelect(partner)}
                aria-label={`Open ${partner.name}`}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-xs transition-all duration-100 active:scale-[0.98] ${
                  isActive
                    ? "border-brand-primary-700 bg-brand-primary-50 ring-2 ring-brand-primary-600/20"
                    : "border-neutral-200 bg-white hover:border-brand-primary-600/50"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary-100 text-xs font-bold text-brand-primary-800">
                  {partner.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={partner.logoUrl}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    partner.initials
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-neutral-900">
                    {partner.name}
                  </strong>
                  <span className="mt-0.5 block truncate text-xs font-medium text-brand-primary-800">
                    {partner.offer}
                  </span>
                  <small className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-neutral-500">
                    <MemberIcon name="pin" size={11} />
                    <span className="truncate">{partner.address}</span>
                  </small>
                </span>
                {partner.distance && (
                  <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                    {partner.distance}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {activePartner && (
        <div className="mt-5">
          <RewardCard partner={activePartner} onSelect={onRedeem} />
        </div>
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
            <strong>{partner.region}</strong>
            {partner.address}
          </span>
        </div>
        <div className="benefits-terms-box">
          <strong>How to redeem</strong>
          <p>{partner.terms}</p>
        </div>
        {hasPhysicalLocation(partner) && (
          <a
            href={googleMapsSearchUrl(partner)}
            target="_blank"
            rel="noreferrer"
          >
            Get Directions
            <MemberIcon name="arrow" size={18} />
          </a>
        )}
      </section>
    </div>
  );
}

export default function BenefitsDirectory({
  partners,
  showChrome = true,
  member = {
    firstName: "",
    lastName: "",
    membershipTierLabel: "Member",
    initials: "M",
  },
}: {
  partners: Partner[];
  showChrome?: boolean;
  member?: MemberSummary;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [view, setView] = useState<BenefitView>("list");
  const [mapSelected, setMapSelected] = useState<Partner | null>(null);
  const [redeemPartner, setRedeemPartnerState] = useState<Partner | null>(null);

  const categories = useMemo<CategoryFilter[]>(
    () => [
      "All",
      ...Array.from(
        new Set(partners.map((partner) => partner.category.trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    ],
    [partners],
  );

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

      <main className="mx-auto w-full max-w-md px-4 pb-8 pt-4">
        <section className="mb-4">
          <h2 className="font-butler text-2xl font-semibold leading-tight text-brand-primary-800">
            Member Benefits
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Access rewards, partner discounts, and active member privileges.
          </p>
        </section>

        <div className="mb-4">
          <MembershipSummary partners={partners} member={member} />
        </div>

        {!hasBenefits ? (
          <section className="benefits-empty-state benefits-empty-state--primary">
            <MemberIcon name="spark" size={30} />
            <h2>Currently there are no benefits</h2>
            <p>New partner rewards will appear here once they are published by admin.</p>
          </section>
        ) : (
          <>
            <label className="relative block">
              <span className="sr-only">Search benefits</span>
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary-800"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search rewards or partners..."
                className="h-12 w-full rounded-full border border-neutral-300 bg-white pl-11 pr-11 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-500 focus:border-brand-primary-700 focus:outline-none focus:ring-4 focus:ring-brand-primary-600/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 transition-transform duration-100 hover:bg-neutral-200 active:scale-95"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </label>

            <CategoryChips
              categories={categories}
              selected={category}
              onSelect={setCategory}
            />

            <div className="mt-2">
              <FeaturedMerchantBanner
                partners={partners}
                onOpenMap={() => setView("map")}
              />
            </div>

            <div
              className="mb-4 grid grid-cols-2 rounded-xl bg-neutral-100 p-1"
              role="group"
              aria-label="Benefit view"
            >
              {(["list", "map"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={view === option}
                  onClick={() => setView(option)}
                  className={`rounded-lg py-2 text-xs font-semibold transition-transform duration-100 active:scale-[0.98] ${
                    view === option
                      ? "bg-white text-brand-primary-800 shadow-xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {option === "list" ? "Rewards" : "Map"}
                </button>
              ))}
            </div>

            <section
              className="mb-3 flex items-end justify-between gap-3"
              aria-live="polite"
            >
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-brand-primary-800">
                  Featured Rewards
                </span>
                <strong className="mt-0.5 block text-sm font-semibold text-neutral-900">
                  {filteredPartners.length} available
                </strong>
              </div>
              {category !== "All" || query ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-brand-primary-800 underline-offset-2 hover:underline active:scale-95"
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
              <section>
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
