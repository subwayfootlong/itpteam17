"use client";

import {
  MEMBERSHIP_TIERS,
  type MembershipTier,
} from "@/lib/membershipTiers";
import type { AudienceType } from "@/lib/tierAccess";

export type AudienceAccessValue = {
  audience_type: AudienceType;
  eligible_tiers: MembershipTier[];
  show_locked_preview: boolean;
};

export const DEFAULT_AUDIENCE_ACCESS: AudienceAccessValue = {
  audience_type: "all",
  eligible_tiers: [],
  show_locked_preview: false,
};

export default function AudienceAccessFields({
  value,
  onChange,
  allowLockedPreview,
}: {
  value: AudienceAccessValue;
  onChange: (value: AudienceAccessValue) => void;
  allowLockedPreview: boolean;
}) {
  const setAudienceType = (audienceType: AudienceType) => {
    onChange({
      ...value,
      audience_type: audienceType,
      eligible_tiers:
        audienceType === "all" ? [] : value.eligible_tiers,
      show_locked_preview:
        audienceType === "all" ? false : value.show_locked_preview,
    });
  };

  const toggleTier = (tier: MembershipTier) => {
    const eligibleTiers = value.eligible_tiers.includes(tier)
      ? value.eligible_tiers.filter((item) => item !== tier)
      : [...value.eligible_tiers, tier];

    onChange({ ...value, eligible_tiers: eligibleTiers });
  };

  return (
    <fieldset className="rounded-2xl border border-[#cfe4ca] bg-[#f7fbf6] p-5">
      <legend className="px-1 text-sm font-bold text-[#1a2e1a]">
        Audience Access
      </legend>
      <p className="mb-4 text-xs leading-5 text-gray-500">
        Choose which active membership tiers can access this content.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <input
            type="radio"
            name="audience_type"
            checked={value.audience_type === "all"}
            onChange={() => setAudienceType("all")}
            className="mt-0.5 h-4 w-4 accent-[#3FAE2A]"
          />
          <span>
            <strong className="block text-sm text-gray-800">All active members</strong>
            <span className="mt-1 block text-xs text-gray-500">Available to every membership tier.</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <input
            type="radio"
            name="audience_type"
            checked={value.audience_type === "selected_tiers"}
            onChange={() => setAudienceType("selected_tiers")}
            className="mt-0.5 h-4 w-4 accent-[#3FAE2A]"
          />
          <span>
            <strong className="block text-sm text-gray-800">Selected tiers</strong>
            <span className="mt-1 block text-xs text-gray-500">Restrict access to one or more tiers.</span>
          </span>
        </label>
      </div>

      {value.audience_type === "selected_tiers" && (
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Eligible tiers
          </span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEMBERSHIP_TIERS.map((tier) => (
              <label
                key={tier.value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={value.eligible_tiers.includes(tier.value)}
                  onChange={() => toggleTier(tier.value)}
                  className="h-4 w-4 accent-[#3FAE2A]"
                />
                {tier.label}
              </label>
            ))}
          </div>
          {value.eligible_tiers.length === 0 && (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Select at least one tier before saving.
            </p>
          )}

          {allowLockedPreview && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <input
                type="checkbox"
                checked={value.show_locked_preview}
                onChange={(event) =>
                  onChange({
                    ...value,
                    show_locked_preview: event.target.checked,
                  })
                }
                className="mt-0.5 h-4 w-4 accent-[#3FAE2A]"
              />
              <span>
                <strong className="block text-sm text-amber-900">Show locked preview</strong>
                <span className="mt-1 block text-xs leading-5 text-amber-800">
                  Other tiers can discover this item, but cannot open, register, or redeem it.
                </span>
              </span>
            </label>
          )}
        </div>
      )}
    </fieldset>
  );
}
