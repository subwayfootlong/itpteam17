"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/admin/Toast";
import { FilterPills } from "@/components/admin/ui/FilterPills";
import StatCard from "@/components/admin/ui/StatCard";
import {
  TableWrapper,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  useSortState,
} from "@/components/admin/ui/Table";
import type {
  ModerationComment,
  ModerationSource,
  ModerationStatus,
} from "@/lib/commentModeration";

type ModerationAction = "approve" | "reject";

const STATUS_STYLE: Record<
  ModerationStatus,
  { bg: string; color: string; dot: string; accent: string; label: string }
> = {
  pending: {
    bg: "#fff4de",
    color: "#9a6800",
    dot: "#FFB547",
    accent: "#FFB547",
    label: "Pending",
  },
  approved: {
    bg: "#e8f5e3",
    color: "#27500A",
    dot: "#3FAE2A",
    accent: "#3FAE2A",
    label: "Approved",
  },
  flagged: {
    bg: "#fde8ef",
    color: "#9f1239",
    dot: "#C51A4A",
    accent: "#C51A4A",
    label: "Rejected",
  },
};

const SOURCE_STYLE: Record<ModerationSource, { bg: string; color: string }> = {
  "admin-announcement": { bg: "#e8f5e3", color: "#27500A" },
  "community-announcement": { bg: "#e3f6fb", color: "#1a7a8f" },
  "discussion-thread": { bg: "#fff4de", color: "#9a6800" },
};

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "flagged" },
];

function formatDate(value: string | null) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: ModerationStatus) {
  const style = STATUS_STYLE[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
      {style.label}
    </span>
  );
}

function sourceBadge(comment: ModerationComment) {
  const style = SOURCE_STYLE[comment.source];

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {comment.sourceLabel}
    </span>
  );
}

export default function CommentModerationPanel({
  initialComments,
}: {
  initialComments: ModerationComment[];
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { sortState, handleSort, sortData } = useSortState("createdAt", "desc");

  const stats = useMemo(
    () => ({
      total: comments.length,
      pending: comments.filter((comment) => comment.status === "pending").length,
      approved: comments.filter((comment) => comment.status === "approved").length,
      rejected: comments.filter((comment) => comment.status === "flagged").length,
    }),
    [comments],
  );

  const filteredComments = useMemo(
    () =>
      filter === "all"
        ? comments
        : comments.filter((comment) => comment.status === filter),
    [comments, filter],
  );

  const sortedComments = useMemo(
    () =>
      sortData(filteredComments, (comment, key) => {
        if (key === "authorName") return comment.authorName;
        if (key === "parentTitle") return comment.parentTitle;
        if (key === "status") return comment.status;
        if (key === "createdAt") return comment.createdAt ?? "";
        return "";
      }),
    [filteredComments, sortData],
  );

  const handleModerate = async (
    comment: ModerationComment,
    action: ModerationAction,
  ) => {
    setBusyId(comment.id);

    try {
      const response = await fetch("/api/admin/comment-moderation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: comment.id,
          source: comment.source,
          action,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Action failed",
        );
      }

      const nextStatus: ModerationStatus =
        action === "approve" ? "approved" : "flagged";
      setComments((current) =>
        current.map((item) =>
          item.id === comment.id && item.source === comment.source
            ? { ...item, status: nextStatus }
            : item,
        ),
      );
      toast.success(action === "approve" ? "Comment approved." : "Comment rejected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const renderRow = (comment: ModerationComment) => {
    const isBusy = busyId === comment.id;

    return (
      <TableRow
        key={`${comment.source}-${comment.id}`}
        accentColor={STATUS_STYLE[comment.status].accent}
        className={isBusy ? "opacity-60" : ""}
      >
        <TableCell>
          <div className="max-w-[360px]">
            <p className="text-[13px] leading-relaxed text-gray-800 line-clamp-3">
              {comment.body}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {sourceBadge(comment)}
              <span className="text-[11px] text-gray-400">
                {comment.parentTitle}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div className="text-[13px] font-semibold text-gray-800">
              {comment.authorName}
            </div>
            <div className="text-[11px] text-gray-400">{comment.authorRole}</div>
          </div>
        </TableCell>
        <TableCell>{statusBadge(comment.status)}</TableCell>
        <TableCell className="text-[12px] text-gray-500">
          {formatDate(comment.createdAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={isBusy || comment.status === "approved"}
              onClick={() => handleModerate(comment, "approve")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-bold text-[#27500A] bg-[#e8f5e3] hover:bg-[#d9efcf] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={isBusy || comment.status === "flagged"}
              onClick={() => handleModerate(comment, "reject")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-[12px] font-bold text-[#9f1239] bg-[#fde8ef] hover:bg-[#fbd1dd] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Reject
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            className="text-[22px] font-bold"
            style={{
              color: "#1a2e1a",
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            Comment Moderation
          </h2>
          <p className="text-[13px] mt-0.5 text-gray-500 font-helvetica">
            Review member comments before they appear in announcements and discussions.
          </p>
        </div>
        <div className="rounded-xl border border-[#dbead6] bg-[#f6fbf3] px-4 py-2 text-[12px] font-medium text-[#27500A] font-helvetica">
          Pending comments are hidden from the public feed.
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} accent="#1a2e1a" />
        <StatCard label="Pending" value={stats.pending} accent="#FFB547" />
        <StatCard label="Approved" value={stats.approved} accent="#3FAE2A" />
        <StatCard label="Rejected" value={stats.rejected} accent="#C51A4A" />
      </div>

      <FilterPills
        options={FILTER_OPTIONS}
        activeValue={filter}
        onChange={setFilter}
      />

      <TableWrapper
        data={sortedComments}
        renderRow={renderRow}
        colCount={5}
        defaultPageSize={10}
        emptyState={
          <div>
            <div className="text-[13px] mb-1 text-gray-500">
              No comments in this queue.
            </div>
            <div className="text-[12px] text-gray-400">
              New member comments will appear here after submission.
            </div>
          </div>
        }
      >
        <TableHead>
          <TableHeader sortKey="parentTitle" sortState={sortState} onSort={handleSort}>
            Comment
          </TableHeader>
          <TableHeader sortKey="authorName" sortState={sortState} onSort={handleSort}>
            Member
          </TableHeader>
          <TableHeader sortKey="status" sortState={sortState} onSort={handleSort}>
            Status
          </TableHeader>
          <TableHeader sortKey="createdAt" sortState={sortState} onSort={handleSort}>
            Submitted
          </TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
      </TableWrapper>
    </div>
  );
}
