"use client";

import { useEffect, useState } from 'react';
import StatCard from '@/components/admin/ui/StatCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

type PollResponse = {
  id: string;
  userId: string;
  name: string;
  email: string;
  response: 'yes' | 'no' | 'maybe';
  updatedAt: string;
};

const RESPONSE_LABELS: Record<PollResponse['response'], string> = {
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
};

const RESPONSE_COLORS: Record<PollResponse['response'], string> = {
  yes: '#3FAE2A',
  maybe: '#FFB547',
  no: '#E05252',
};

export default function AnnouncementPollCard({
  announcementId,
  pollQuestion,
}: {
  announcementId: string;
  pollQuestion: string;
}) {
  const [counts, setCounts] = useState({ yes: 0, no: 0, maybe: 0 });
  const [responses, setResponses] = useState<PollResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/announcements/${announcementId}/poll-responses`)
      .then((r) => r.json())
      .then((d) => {
        setCounts(d.counts ?? { yes: 0, no: 0, maybe: 0 });
        setResponses(d.responses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [announcementId]);

  const total = counts.yes + counts.no + counts.maybe;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-lg font-bold text-gray-800 font-butler">Attendance Poll</h3>
        <p className="text-xs text-gray-500 mt-1 font-helvetica">{pollQuestion}</p>
      </div>

      <div className="p-6 flex flex-col gap-4 font-helvetica bg-gray-50/30 flex-1">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center text-gray-500">
            <LoadingSpinner label="Loading responses…" />
          </div>
        ) : (
          <>
            <StatCard label="Yes" value={counts.yes} accent={RESPONSE_COLORS.yes} />
            <StatCard label="Maybe" value={counts.maybe} accent={RESPONSE_COLORS.maybe} />
            <StatCard label="No" value={counts.no} accent={RESPONSE_COLORS.no} />

            <div className="mt-2 pt-4 border-t border-gray-200">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                {total} {total === 1 ? 'response' : 'responses'}
              </div>
              {responses.length === 0 ? (
                <p className="text-sm text-gray-400">No responses yet.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {responses.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-700 truncate">{r.name}</div>
                        <div className="text-xs text-gray-400 truncate">{r.email}</div>
                      </div>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                        style={{
                          color: RESPONSE_COLORS[r.response],
                          backgroundColor: `${RESPONSE_COLORS[r.response]}15`,
                        }}
                      >
                        {RESPONSE_LABELS[r.response]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
