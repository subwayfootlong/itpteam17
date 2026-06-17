"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilterPills } from '@/components/admin/ui/FilterPills';
import { ActionLink } from '@/components/admin/ui/Button';
import StatCard from '@/components/admin/ui/StatCard';
import { Badge } from '@/components/admin/ui/Badge';
import {
  TableWrapper,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/admin/ui/Table';

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
    <div className="space-y-5 w-full pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold font-butler"  style={{ color: '#1a2e1a' }}>
            Event Management
          </h2>
          <p className="text-[13px] mt-0.5 font-helvetica"  style={{ color: '#939498' }}>
            Create, publish, and manage Pergas programmes and seminars
          </p>
        </div>
        <ActionLink href="/admin/events/new" icon={true}>
          Create New Event
        </ActionLink>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: stats.total, accent: '#1a2e1a' },
          { label: 'Published', value: stats.published, accent: '#3FAE2A' },
          { label: 'Drafts', value: stats.draft, accent: '#FFB547' },
          { label: 'Upcoming', value: stats.upcoming, accent: '#3BB0C9' },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>

      {/* Filter bar */}
      <FilterPills 
        options={['all', 'published', 'draft', 'archived']} 
        activeValue={statusFilter} 
        onChange={setStatusFilter} 
      />

      {/* Table */}
      <TableWrapper>
        <TableHead>
          <TableHeader className="w-8" />
          <TableHeader>Event</TableHeader>
          <TableHeader>Date & Time</TableHeader>
          <TableHeader>Venue</TableHeader>
          <TableHeader>Category</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
        <TableBody>
          {loading ? (
            [...Array(4)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(7)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-3 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                <div className="mb-2">No events found</div>
                <Link href="/admin/events/new" className="text-[#3FAE2A] font-medium hover:underline">
                  Create your first event →
                </Link>
              </TableCell>
            </TableRow>
          ) : (
            events.map((ev) => {
              const statusConfig =
                ev.status === 'published'
                  ? { colorClass: 'bg-[#e8f5e3] text-[#27500A]', dotColor: 'bg-[#3FAE2A]' }
                  : ev.status === 'draft'
                    ? { colorClass: 'bg-[#fff4de] text-[#9a6800]', dotColor: 'bg-[#FFB547]' }
                    : { colorClass: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' };

              return (
                <TableRow key={ev.id}>
                  <TableCell className="w-8">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-gray-800">{ev.title}</div>
                    {ev.external_rsvp_url && (
                      <div className="text-[11px] text-[#3FAE2A] mt-0.5 font-medium">External RSVP linked</div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="font-medium">{new Date(ev.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    {ev.start_time && <div className="text-[11px] mt-0.5">{ev.start_time}</div>}
                  </TableCell>
                  <TableCell className="text-gray-600 max-w-[160px] truncate">
                    {ev.venue ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge colorClass="bg-[#e3f6fb] text-[#1a7a8f]">
                      {ev.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge colorClass={statusConfig.colorClass} dotColor={statusConfig.dotColor}>
                      {ev.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3">
                      {ev.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(ev.id, 'published')}
                          className="text-[12px] text-[#3FAE2A] hover:text-[#27500A] font-bold transition-colors"
                        >
                          PUBLISH
                        </button>
                      )}
                      {ev.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(ev.id, 'draft')}
                          className="text-[12px] text-amber-600 hover:text-amber-800 font-bold transition-colors"
                        >
                          UNPUBLISH
                        </button>
                      )}
                      <Link
                        href={`/admin/events/${ev.id}/edit`}
                        className="text-gray-400 hover:text-[#3BB0C9] transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        disabled={deleting === ev.id}
                        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </TableWrapper>
    </div>
  );
}