"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  venue: string | null;
  category: string;
  capacity: number | null;
  status: 'draft' | 'published' | 'archived';
  external_rsvp_url: string | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-500',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchEvents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    fetch(`/api/admin/events?${params}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [statusFilter]); // eslint-disable-line

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    setDeleting(null);
    fetchEvents();
  };

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === 'published').length,
    draft: events.filter((e) => e.status === 'draft').length,
    upcoming: events.filter(
      (e) => e.event_date >= new Date().toISOString().split('T')[0] && e.status === 'published'
    ).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Event Management</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Create, publish, and manage Pergas programmes and seminars
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#3FAE2A] hover:bg-[#35941f] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create New Event
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total },
          { label: 'Published', value: stats.published, color: 'text-green-600' },
          { label: 'Drafts', value: stats.draft, color: 'text-amber-600' },
          { label: 'Upcoming', value: stats.upcoming, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color ?? 'text-gray-800'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        {['all', 'published', 'draft', 'archived'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              statusFilter === s
                ? 'bg-[#3FAE2A] text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:border-[#3FAE2A]'
            }`}
          >
            {s === 'all' ? 'All Events' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider w-8" />
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Event</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Date & Time</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Venue</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="text-gray-400 mb-2">No events found</div>
                    <Link href="/admin/events/new" className="text-[#3FAE2A] text-sm hover:underline">
                      Create your first event →
                    </Link>
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    {/* Color dot by status */}
                    <td className="pl-5">
                      <div className={`w-2 h-2 rounded-full ${ev.status === 'published' ? 'bg-green-500' : ev.status === 'draft' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-800">{ev.title}</div>
                      {ev.external_rsvp_url && (
                        <div className="text-xs text-[#3FAE2A] mt-0.5">External RSVP linked</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      <div>{new Date(ev.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      {ev.start_time && <div className="mt-0.5">{ev.start_time}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[160px] truncate">
                      {ev.venue ?? '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLE[ev.status]}`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick publish/unpublish toggle */}
                        {ev.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(ev.id, 'published')}
                            className="text-xs text-green-600 hover:underline font-medium"
                          >
                            Publish
                          </button>
                        )}
                        {ev.status === 'published' && (
                          <button
                            onClick={() => handleStatusChange(ev.id, 'archived')}
                            className="text-xs text-amber-600 hover:underline font-medium"
                          >
                            Archive
                          </button>
                        )}
                        <Link
                          href={`/admin/events/${ev.id}/edit`}
                          className="text-xs text-[#3FAE2A] hover:underline font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          disabled={deleting === ev.id}
                          className="text-xs text-red-500 hover:underline font-medium disabled:opacity-40"
                        >
                          {deleting === ev.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
