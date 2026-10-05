"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Clock3, History, Inbox, Search, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { FilterPills } from "@/components/admin/ui/FilterPills";
import type { ModerationComment, ModerationSource, ModerationStatus } from "@/lib/commentModeration";
import { formatDateTime } from "@/lib/dates";

type ModerationAction = "approve" | "reject";
type ModerationQueue = "announcements" | "discussions";
type StatusFilter = "all" | ModerationStatus;
type SortOrder = "oldest" | "newest";

const PAGE_SIZE = 8;

const STATUS_STYLE: Record<ModerationStatus, { bg: string; color: string; dot: string; border: string; label: string }> = {
  pending: { bg: "#fff4de", color: "#9a6800", dot: "#FFB547", border: "#f2d49a", label: "Pending" },
  approved: { bg: "#e8f5e3", color: "#27500A", dot: "#3FAE2A", border: "#cce5c3", label: "Approved" },
  flagged: { bg: "#fde8ef", color: "#9f1239", dot: "#C51A4A", border: "#f3c1d0", label: "Rejected" },
};

const SOURCE_STYLE: Record<ModerationSource, { bg: string; color: string }> = {
  "admin-announcement": { bg: "#e8f5e3", color: "#27500A" },
  "community-announcement": { bg: "#e3f6fb", color: "#1a7a8f" },
  "discussion-post": { bg: "#f0faf0", color: "#087100" },
  "discussion-thread": { bg: "#fff4de", color: "#9a6800" },
};

const QUEUE_OPTIONS = [
  { label: "Discussion queue", value: "discussions" },
  { label: "Announcement queue", value: "announcements" },
];

const STATUS_TABS: Array<{ value: StatusFilter; label: string; icon: typeof Inbox }> = [
  { value: "pending", label: "Pending", icon: Inbox },
  { value: "approved", label: "Approved", icon: Check },
  { value: "flagged", label: "Rejected", icon: X },
  { value: "all", label: "All History", icon: History },
];

function isDiscussionSource(source: ModerationSource) {
  return source === "discussion-post" || source === "discussion-thread";
}

function itemKey(item: ModerationComment) {
  return `${item.source}-${item.id}`;
}

function StatusBadge({ status }: { status: ModerationStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {style.label}
    </span>
  );
}

function SourceBadge({ comment }: { comment: ModerationComment }) {
  const style = SOURCE_STYLE[comment.source];
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: style.bg, color: style.color }}>
      {comment.sourceLabel}
    </span>
  );
}

function waitingInfo(createdAt: string | null, referenceTime: string) {
  if (!createdAt) return { label: "Submission time unavailable", className: "bg-gray-100 text-gray-600" };
  const elapsed = Math.max(0, new Date(referenceTime).getTime() - new Date(createdAt).getTime());
  const hours = Math.max(1, Math.floor(elapsed / 3_600_000));
  if (hours >= 48) return { label: `Waiting ${Math.floor(hours / 24)} days · Needs attention`, className: "bg-red-50 text-red-700" };
  if (hours >= 24) return { label: "Waiting 1 day", className: "bg-amber-50 text-amber-700" };
  return { label: `Waiting ${hours} ${hours === 1 ? "hour" : "hours"}`, className: "bg-green-50 text-green-700" };
}

export default function CommentModerationPanel({
  initialComments,
  referenceTime,
}: {
  initialComments: ModerationComment[];
  referenceTime: string;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [queue, setQueue] = useState<ModerationQueue>("discussions");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [sourceFilter, setSourceFilter] = useState<"all" | ModerationSource>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const queueComments = useMemo(
    () => comments.filter((comment) => queue === "discussions" ? isDiscussionSource(comment.source) : !isDiscussionSource(comment.source)),
    [comments, queue],
  );

  const stats = useMemo(() => ({
    pending: queueComments.filter((comment) => comment.status === "pending").length,
    approved: queueComments.filter((comment) => comment.status === "approved").length,
    flagged: queueComments.filter((comment) => comment.status === "flagged").length,
    all: queueComments.length,
  }), [queueComments]);

  const sourceOptions = queue === "discussions"
    ? [
        { value: "all", label: "All discussion items" },
        { value: "discussion-post", label: "Posts" },
        { value: "discussion-thread", label: "Replies" },
      ]
    : [
        { value: "all", label: "All announcement comments" },
        { value: "admin-announcement", label: "Official announcements" },
        { value: "community-announcement", label: "Community announcements" },
      ];

  const filteredComments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return queueComments
      .filter((comment) => statusFilter === "all" || comment.status === statusFilter)
      .filter((comment) => sourceFilter === "all" || comment.source === sourceFilter)
      .filter((comment) => !query || [comment.body, comment.authorName, comment.parentTitle, comment.sourceLabel]
        .some((value) => value.toLowerCase().includes(query)))
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return sortOrder === "oldest" ? leftTime - rightTime : rightTime - leftTime;
      });
  }, [queueComments, search, sortOrder, sourceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComments.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredComments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedComment = pageItems.find((comment) => itemKey(comment) === selectedKey) ?? pageItems[0] ?? null;
  const selectedPosition = selectedComment
    ? filteredComments.findIndex((comment) => itemKey(comment) === itemKey(selectedComment)) + 1
    : 0;

  function changeQueue(value: string) {
    setQueue(value as ModerationQueue);
    setStatusFilter("pending");
    setSourceFilter("all");
    setSortOrder("oldest");
    setSelectedKey(null);
    setPage(1);
  }

  function changeStatus(value: StatusFilter) {
    setStatusFilter(value);
    setSortOrder(value === "pending" ? "oldest" : "newest");
    setSelectedKey(null);
    setPage(1);
  }

  async function handleModerate(
    comment: ModerationComment,
    action: ModerationAction,
    isDecisionChange = false,
  ) {
    setBusyId(comment.id);
    try {
      const response = await fetch("/api/admin/comment-moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: comment.id,
          source: comment.source,
          action,
          currentStatus: comment.status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Action failed");

      const nextStatus: ModerationStatus = action === "approve" ? "approved" : "flagged";
      setComments((current) => current.map((item) => (
        item.id === comment.id && item.source === comment.source ? { ...item, status: nextStatus } : item
      )));
      setSelectedKey(null);
      if (isDecisionChange) {
        toast.success(action === "approve" ? "Decision changed to approved." : "Decision changed to rejected.");
      } else {
        toast.success(action === "approve" ? "Item approved. Next item selected." : "Item rejected. Next item selected.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  function changeDecision(comment: ModerationComment) {
    const approving = comment.status === "flagged";
    void handleModerate(comment, approving ? "approve" : "reject", true);
  }

  return (
    <section className="space-y-5 font-helvetica">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-butler text-[22px] font-bold text-[#1a2e1a]">Community Moderation</h2>
          <p className="mt-0.5 text-[13px] text-gray-500">Work through member submissions in a focused, oldest-first queue.</p>
        </div>
        <div className="rounded-xl border border-[#dbead6] bg-[#f6fbf3] px-4 py-2 text-[12px] font-medium text-[#27500A]">
          Pending items remain hidden from members.
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <FilterPills options={QUEUE_OPTIONS} activeValue={queue} onChange={changeQueue} />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = statusFilter === tab.value;
            return (
              <button key={tab.value} type="button" onClick={() => changeStatus(tab.value)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[13px] font-bold ${active ? "bg-[#27500A] text-white" : "bg-gray-50 text-gray-600 hover:bg-[#e8f5e3] hover:text-[#27500A]"}`}>
                <Icon size={15} /> {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? "bg-white/20" : "bg-white"}`}>{stats[tab.value]}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_150px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); setSelectedKey(null); }} placeholder="Search member, message, or discussion…" className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-9 pr-3 text-[13px] outline-none focus:border-[#3FAE2A] focus:bg-white focus:ring-4 focus:ring-[#3FAE2A]/10" />
          </div>
          <select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value as "all" | ModerationSource); setPage(1); setSelectedKey(null); }} className="h-10 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-700 outline-none focus:border-[#3FAE2A]">
            {sourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as SortOrder); setPage(1); setSelectedKey(null); }} className="h-10 rounded-lg border border-gray-200 bg-gray-50/50 px-3 text-[13px] text-gray-700 outline-none focus:border-[#3FAE2A]">
            <option value="oldest">Oldest first</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Check className="mx-auto text-[#3FAE2A]" size={30} />
          <p className="mt-3 font-bold text-gray-800">{statusFilter === "pending" ? "Queue complete" : "No moderation history found"}</p>
          <p className="mt-1 text-sm text-gray-500">{statusFilter === "pending" ? "There are no submissions waiting for review." : "Try changing the search or filters."}</p>
        </div>
      ) : (
        <div className="grid h-[620px] min-h-[460px] max-h-[calc(100vh-220px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:grid-cols-[360px_1fr]">
          <div className="flex min-h-0 flex-col border-b border-gray-200 bg-gray-50/40 xl:border-b-0 xl:border-r">
            <div className="shrink-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{filteredComments.length} items</p>
              <p className="text-xs text-gray-400">Page {safePage} of {totalPages}</p>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
              {pageItems.map((comment) => {
                const selected = selectedComment && itemKey(selectedComment) === itemKey(comment);
                const waiting = waitingInfo(comment.createdAt, referenceTime);
                return (
                  <button key={itemKey(comment)} type="button" onClick={() => setSelectedKey(itemKey(comment))} className={`block w-full border-l-4 px-4 py-3 text-left transition-colors ${selected ? "border-l-[#3FAE2A] bg-[#f3faef]" : "border-l-transparent bg-white hover:bg-gray-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13px] font-bold text-gray-800">{comment.authorName}</p>
                      <StatusBadge status={comment.status} />
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-[12px] leading-5 text-gray-600">{comment.body}</p>
                    <p className="mt-1 truncate text-[11px] text-gray-400">{comment.parentTitle}</p>
                    {comment.status === "pending" && (
                      <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${waiting.className}`}><Clock3 className="mr-1" size={12} /> {waiting.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="shrink-0 flex items-center justify-between border-t border-gray-200 bg-white p-3">
                <button type="button" disabled={safePage === 1} onClick={() => { setPage(Math.max(1, safePage - 1)); setSelectedKey(null); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-600 disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
                <button type="button" disabled={safePage === totalPages} onClick={() => { setPage(Math.min(totalPages, safePage + 1)); setSelectedKey(null); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-600 disabled:opacity-40">Next <ChevronRight size={15} /></button>
              </div>
            )}
          </div>

          {selectedComment && (
            <article className="min-h-0 min-w-0 overflow-y-auto p-5 lg:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><SourceBadge comment={selectedComment} /><StatusBadge status={selectedComment.status} /></div>
                  <h3 className="mt-3 text-lg font-bold text-[#1a2e1a]">{selectedComment.parentTitle}</h3>
                  <p className="mt-1 text-xs text-gray-400">Submitted {formatDateTime(selectedComment.createdAt)}</p>
                </div>
                <span className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">Reviewing {selectedPosition} of {filteredComments.length}</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f5e3] text-sm font-bold text-[#27500A]">{selectedComment.authorName.charAt(0).toUpperCase()}</div>
                <div><p className="text-sm font-bold text-gray-800">{selectedComment.authorName}</p><p className="text-xs text-gray-500">{selectedComment.authorRole}</p></div>
              </div>

              <div className="mt-4 max-h-[260px] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Submitted content</p>
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-gray-800">{selectedComment.body}</p>
              </div>

              {selectedComment.status === "pending" ? (
                <div className="sticky bottom-0 z-10 mt-4 grid gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:grid-cols-2">
                  <button type="button" disabled={busyId === selectedComment.id} onClick={() => void handleModerate(selectedComment, "reject")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"><X size={17} /> Reject &amp; Next</button>
                  <button type="button" disabled={busyId === selectedComment.id} onClick={() => void handleModerate(selectedComment, "approve")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2F8F22] px-4 text-sm font-bold text-white hover:bg-[#26751c] disabled:opacity-50"><Check size={17} /> {busyId === selectedComment.id ? "Saving…" : "Approve & Next"}</button>
                </div>
              ) : (
                <div className="sticky bottom-0 z-10 mt-4 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      This submission is retained in moderation history as <strong>{STATUS_STYLE[selectedComment.status].label.toLowerCase()}</strong>.
                    </p>
                    <button
                      type="button"
                      disabled={busyId === selectedComment.id}
                      onClick={() => changeDecision(selectedComment)}
                      className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold disabled:opacity-50 ${
                        selectedComment.status === "approved"
                          ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                          : "border-green-200 bg-white text-[#27500A] hover:bg-green-50"
                      }`}
                    >
                      {selectedComment.status === "approved" ? <X size={16} /> : <Check size={16} />}
                      {busyId === selectedComment.id
                        ? "Updating…"
                        : selectedComment.status === "approved"
                          ? "Change to Rejected"
                          : "Change to Approved"}
                    </button>
                  </div>
                </div>
              )}

            </article>
          )}
        </div>
      )}
    </section>
  );
}
