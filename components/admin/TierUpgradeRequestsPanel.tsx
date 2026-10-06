"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock3, History, RefreshCw, Search, X } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatTierLabel, TIER_COLORS } from "@/lib/membershipTiers";
import { Badge } from "@/components/admin/ui/Badge";

type RequestStatus = "pending" | "approved" | "rejected";

type TierRequest = {
  id: string;
  user_id: string;
  current_tier: string;
  requested_tier: string;
  reason: string | null;
  status: RequestStatus;
  admin_note: string | null;
  reviewerName: string | null;
  reviewed_at: string | null;
  created_at: string;
  member: {
    id: string;
    name: string;
    email: string;
    memberId: string | null;
  } | null;
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const HISTORY_TABS: Array<{
  value: "all" | RequestStatus;
  label: string;
  icon: typeof History;
}> = [
  { value: "pending", label: "Pending", icon: Clock3 },
  { value: "approved", label: "Approved", icon: Check },
  { value: "rejected", label: "Rejected", icon: X },
  { value: "all", label: "All History", icon: History },
];

export default function TierUpgradeRequestsPanel() {
  const [requests, setRequests] = useState<TierRequest[]>([]);
  const [filter, setFilter] = useState<"all" | RequestStatus>("pending");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/tier-requests", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load tier requests");
      setRequests(data.requests || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tier requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/tier-requests", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load tier requests");
        return data;
      })
      .then((data) => {
        if (active) setRequests(data.requests || []);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load tier requests");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => ({
    pending: requests.filter((request) => request.status === "pending").length,
    approved: requests.filter((request) => request.status === "approved").length,
    rejected: requests.filter((request) => request.status === "rejected").length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter;
      const matchesSearch = !query || [
        request.member?.name,
        request.member?.email,
        request.member?.memberId,
        request.requested_tier,
      ].some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [filter, requests, search]);

  async function reviewRequest(id: string, action: "approve" | "reject") {
    if (action === "reject" && !notes[id]?.trim()) {
      setError("Add an admin note before rejecting a request so the member understands the decision.");
      return;
    }

    setReviewingId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/tier-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, adminNote: notes[id] || "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review request");
      setNotes((current) => ({ ...current, [id]: "" }));
      await loadRequests();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review request");
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-12 font-helvetica">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-butler text-[22px] font-bold text-[#1a2e1a]">Tier Upgrade Requests</h2>
          <p className="mt-0.5 text-[13px] text-[#939498]">Review member applications and manage membership tier changes</p>
        </div>
        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Pending Review", value: stats.pending, color: "#B7791F", icon: <Clock3 size={18} /> },
          { label: "Approved", value: stats.approved, color: "#2F855A", icon: <Check size={18} /> },
          { label: "Rejected", value: stats.rejected, color: "#C53030", icon: <X size={18} /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50" style={{ color: stat.color }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
          {HISTORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.value === "all" ? requests.length : stats[tab.value];
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-bold transition-colors ${
                  active
                    ? "bg-[#27500A] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-[#e8f5e3] hover:text-[#27500A]"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20 text-white" : "bg-white text-gray-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative mt-4 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, email, ID, or tier…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-[13px] outline-none focus:border-[#3FAE2A] focus:bg-white focus:ring-4 focus:ring-[#3FAE2A]/10"
          />
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="space-y-3">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-gray-500">
            <LoadingSpinner label="Loading tier requests…" />
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            {filter === "pending" ? "No tier requests are waiting for review." : "No tier request history matches this view."}
          </div>
        ) : visibleRequests.map((request) => (
          <article key={request.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {request.member ? (
                    <Link href={`/admin/members/${request.member.id}`} className="font-bold text-gray-900 hover:text-[#3FAE2A]">{request.member.name}</Link>
                  ) : <span className="font-bold text-gray-500">Deleted member</span>}
                  <Badge colorClass={STATUS_STYLES[request.status]}>{request.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {request.member?.memberId || "No member ID"} · {request.member?.email || "Email unavailable"} · Submitted {new Date(request.created_at).toLocaleString("en-SG")}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <Badge colorClass={TIER_COLORS[request.current_tier] || "bg-gray-100 text-gray-700"}>{formatTierLabel(request.current_tier)}</Badge>
                  <span className="font-bold text-gray-400">→</span>
                  <Badge colorClass={TIER_COLORS[request.requested_tier] || "bg-gray-100 text-gray-700"}>{formatTierLabel(request.requested_tier)}</Badge>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Member&apos;s reason</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">{request.reason || "No reason provided."}</p>
                </div>
              </div>

              {request.status === "pending" ? (
                <div className="w-full lg:w-[340px]">
                  <label htmlFor={`note-${request.id}`} className="block text-xs font-bold uppercase tracking-wide text-gray-500">Admin note</label>
                  <textarea
                    id={`note-${request.id}`}
                    maxLength={1000}
                    rows={4}
                    value={notes[request.id] || ""}
                    onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))}
                    placeholder="Optional for approval; required for rejection"
                    className="mt-2 w-full resize-y rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={reviewingId === request.id}
                      onClick={() => void reviewRequest(request.id, "reject")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    ><X size={16} /> Reject</button>
                    <button
                      type="button"
                      disabled={reviewingId === request.id}
                      onClick={() => void reviewRequest(request.id, "approve")}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2F8F22] px-3 text-sm font-bold text-white hover:bg-[#26751c] disabled:opacity-50"
                    ><Check size={16} /> {reviewingId === request.id ? "Saving…" : "Approve"}</button>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 lg:w-[300px]">
                  <p><strong>Reviewed by:</strong> {request.reviewerName || "Administrator"}</p>
                  {request.reviewed_at && <p className="mt-1"><strong>Reviewed:</strong> {new Date(request.reviewed_at).toLocaleString("en-SG")}</p>}
                  {request.admin_note && <p className="mt-3 leading-6"><strong>Note:</strong> {request.admin_note}</p>}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
