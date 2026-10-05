"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpCircle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { formatTierLabel, type MembershipTier } from "@/lib/membershipTiers";

type TierOption = { value: MembershipTier; label: string };
type TierRequest = {
  id: string;
  current_tier: string;
  requested_tier: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export default function TierUpgradeRequestView() {
  const [currentTier, setCurrentTier] = useState("basic");
  const [availableTiers, setAvailableTiers] = useState<TierOption[]>([]);
  const [requests, setRequests] = useState<TierRequest[]>([]);
  const [requestedTier, setRequestedTier] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/member/tier-upgrade", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load tier requests");
      setCurrentTier(data.currentTier || "basic");
      setAvailableTiers(data.availableTiers || []);
      setRequests(data.requests || []);
      setRequestedTier((current) => current || data.availableTiers?.[0]?.value || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tier requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/member/tier-upgrade", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load tier requests");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setCurrentTier(data.currentTier || "basic");
        setAvailableTiers(data.availableTiers || []);
        setRequests(data.requests || []);
        setRequestedTier(data.availableTiers?.[0]?.value || "");
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

  const pendingRequest = requests.find((request) => request.status === "pending");

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/member/tier-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedTier, reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit request");
      setReason("");
      setSuccess("Your request has been sent to the administrators for review.");
      await loadRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 py-5">
      <Link href="/member/profile" className="member-text-sm inline-flex items-center gap-2 text-sm font-semibold text-[#0F6E00]">
        <ArrowLeft size={17} /> Back to profile
      </Link>

      <header className="mt-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F5E3] text-[#0F6E00]">
          <ArrowUpCircle size={27} />
        </div>
        <h1 className="member-text-2xl mt-4 text-2xl font-bold text-[#151C27]">Request a tier upgrade</h1>
        <p className="member-text-sm mt-2 text-sm leading-6 text-[#5F5E5E]">
          Your current membership is <strong>{formatTierLabel(currentTier)}</strong>. Choose an available tier and explain why you are applying.
        </p>
      </header>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</div>}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Loading membership requests…</div>
      ) : pendingRequest ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 font-bold text-amber-800"><Clock3 size={19} /> Request under review</div>
          <p className="mt-3 text-sm text-amber-900">
            {formatTierLabel(pendingRequest.current_tier)} → {formatTierLabel(pendingRequest.requested_tier)}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">{pendingRequest.reason}</p>
          <p className="mt-3 text-xs text-amber-700">Submitted {new Date(pendingRequest.created_at).toLocaleString("en-SG")}</p>
        </section>
      ) : availableTiers.length > 0 ? (
        <form onSubmit={submitRequest} className="mt-6 space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <label htmlFor="requested-tier" className="member-text-sm block text-sm font-bold text-[#151C27]">Requested tier</label>
            <select
              id="requested-tier"
              required
              value={requestedTier}
              onChange={(event) => setRequestedTier(event.target.value)}
              className="member-text-base mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-[#151C27] outline-none focus:border-[#0F6E00] focus:ring-4 focus:ring-green-100"
            >
              {availableTiers.map((tier) => <option key={tier.value} value={tier.value}>{tier.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="upgrade-reason" className="member-text-sm block text-sm font-bold text-[#151C27]">Reason for upgrade</label>
            <textarea
              id="upgrade-reason"
              required
              maxLength={1000}
              rows={6}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain your eligibility or provide any information the administrator should review."
              className="member-text-base mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-[#151C27] outline-none focus:border-[#0F6E00] focus:ring-4 focus:ring-green-100"
            />
            <p className="member-text-xs mt-1 text-right text-xs text-gray-500">{reason.length}/1000</p>
          </div>

          <button
            type="submit"
            disabled={submitting || !requestedTier || !reason.trim()}
            className="member-text-base min-h-12 w-full rounded-xl bg-[#0F7A00] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit upgrade request"}
          </button>
        </form>
      ) : (
        <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">
          <div className="flex items-center gap-2 font-bold"><CheckCircle2 size={19} /> Highest tier reached</div>
          <p className="mt-2 text-sm leading-6">There are no higher membership tiers available for your account.</p>
        </section>
      )}

      {requests.filter((request) => request.status !== "pending").length > 0 && (
        <section className="mt-8">
          <h2 className="member-text-xl text-xl font-bold text-[#151C27]">Request history</h2>
          <div className="mt-4 space-y-3">
            {requests.filter((request) => request.status !== "pending").map((request) => (
              <article key={request.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[#151C27]">{formatTierLabel(request.current_tier)} → {formatTierLabel(request.requested_tier)}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${request.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                    {request.status === "approved" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {request.status === "approved" ? "Approved" : "Rejected"}
                  </span>
                </div>
                {request.admin_note && <p className="mt-3 text-sm leading-6 text-gray-600"><strong>Admin note:</strong> {request.admin_note}</p>}
                <p className="mt-3 text-xs text-gray-400">Submitted {new Date(request.created_at).toLocaleDateString("en-SG")}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
