"use client";

import { useEffect, useState } from "react";
import AudienceAccessFields, {
  type AudienceAccessValue,
} from "@/components/admin/AudienceAccessFields";
import { useToast } from "@/components/ui/Toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatAudienceLabel, normalizeTierAudience } from "@/lib/tierAccess";

type AdminDiscussionGroup = {
  id: string;
  title: string;
  icon: string | null;
  tone: string | null;
  sort_order: number | null;
  audience_type: "all" | "selected_tiers" | null;
  eligible_tiers: string[] | null;
  show_locked_preview: boolean | null;
};

function audienceValue(group: AdminDiscussionGroup): AudienceAccessValue {
  const audience = normalizeTierAudience(group);
  return {
    audience_type: audience.audienceType,
    eligible_tiers: audience.eligibleTiers,
    show_locked_preview: false,
  };
}

export default function DiscussionGroupAudienceManager() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<AdminDiscussionGroup[]>([]);
  const [editing, setEditing] = useState<AdminDiscussionGroup | null>(null);
  const [audience, setAudience] = useState<AudienceAccessValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/discussion-groups", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load discussion spaces.");
        if (active) setGroups(result.groups ?? []);
      })
      .catch((error) => {
        if (active) toast.error(error instanceof Error ? error.message : "Unable to load discussion spaces.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [toast]);

  const startEditing = (group: AdminDiscussionGroup) => {
    setEditing(group);
    setAudience(audienceValue(group));
  };

  const save = async () => {
    if (!editing || !audience) return;
    if (audience.audience_type === "selected_tiers" && audience.eligible_tiers.length === 0) {
      toast.warning("Select at least one eligible membership tier.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/discussion-groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...audience, show_locked_preview: false }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.group) {
        throw new Error(result.error ?? "Unable to update discussion access.");
      }

      setGroups((current) =>
        current.map((group) => (group.id === result.group.id ? result.group : group)),
      );
      setEditing(null);
      setAudience(null);
      toast.success("Discussion audience updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update discussion access.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1a2e1a]">Discussion Space Access</h2>
          <p className="mt-1 text-sm text-gray-500">
            Restricted spaces are completely hidden from ineligible tiers.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex min-h-24 items-center justify-center text-gray-500">
          <LoadingSpinner label="Loading discussion spaces…" />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <article key={group.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800">{group.title}</h3>
                  <span className="mt-2 inline-flex rounded-full bg-[#eef5ec] px-2.5 py-1 text-xs font-bold text-[#27500A]">
                    {formatAudienceLabel(normalizeTierAudience(group))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startEditing(group)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:border-[#3FAE2A] hover:text-[#27500A]"
                >
                  Edit access
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && audience && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <h3 className="mb-3 font-bold text-gray-800">Edit: {editing.title}</h3>
          <AudienceAccessFields
            value={audience}
            onChange={setAudience}
            allowLockedPreview={false}
          />
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setAudience(null);
              }}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-[#3FAE2A] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? <LoadingSpinner label="Saving…" size="sm" light /> : "Save access"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
