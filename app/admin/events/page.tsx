"use client";

import { useEffect, useMemo, useState } from 'react';
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
  useSortState,
} from '@/components/admin/ui/Table';

interface Event {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  category: string;
  capacity: number | null;
  spots_available: number | null;
  status: 'draft' | 'published' | 'archived';
  external_rsvp_url: string | null;
  image_url: string | null;
  created_at: string;
}

// ─── Registration progress bar ───────────────────────────────────────────────

function RegistrationBar({ capacity, spotsAvailable }: { capacity: number | null; spotsAvailable: number | null }) {
  if (!capacity) {
    return <span className="text-gray-400 text-[12px]">—</span>;
  }

  const taken = capacity - (spotsAvailable ?? 0);
  const pct = Math.min(100, Math.max(0, (taken / capacity) * 100));

  // Colour thresholds: green → amber → red
  const barColor =
    pct >= 90 ? '#C51A4A' :
    pct >= 70 ? '#FFB547' :
    '#3FAE2A';

  const bgColor =
    pct >= 90 ? '#fde8ef' :
    pct >= 70 ? '#fff4de' :
    '#e8f5e3';

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: bgColor }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className="text-[11px] font-medium tabular-nums whitespace-nowrap" style={{ color: barColor }}>
        {taken}/{capacity}
      </span>
    </div>
  );
}

// ─── Time formatter ───────────────────────────────────────────────────────────

function formatTime(t: string | null): string {
  if (!t) return '';
  // If already "HH:MM", display as-is; try to parse
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  published: { colorClass: 'bg-[#e8f5e3] text-[#27500A]', dotColor: 'bg-[#3FAE2A]', accent: '#3FAE2A' },
  draft:     { colorClass: 'bg-[#fff4de] text-[#9a6800]',  dotColor: 'bg-[#FFB547]',  accent: '#FFB547' },
  archived:  { colorClass: 'bg-gray-100 text-gray-600',    dotColor: 'bg-gray-400',   accent: '#d1d5db' },
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const { sortState, handleSort, sortData } = useSortState('event_date', 'desc');

  const fetchEvents = () => {
    setLoading(true);
    fetch(`/api/admin/events`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []); // Fetch once, filter locally

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

  // Stats use the full global events list, NOT the filtered list
  const stats = {
    total:     events.length,
    published: events.filter((e) => e.status === 'published').length,
    draft:     events.filter((e) => e.status === 'draft').length,
    upcoming:  events.filter(
      (e) => e.event_date >= new Date().toISOString().split('T')[0] && e.status === 'published'
    ).length,
  };

  // 1. Filter events client-side based on statusFilter
  // 2. Sort the filtered events
  const filteredEvents = useMemo(() => {
    return statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter);
  }, [events, statusFilter]);

  const nextMajorEvent = useMemo(() => {
    const upcoming = events.filter(
      (e) => e.status === 'published' && e.event_date >= new Date().toISOString().split('T')[0]
    );
    
    if (upcoming.length === 0) return null;
    
    // Sort by capacity descending (biggest event), then by date
    upcoming.sort((a, b) => {
      const capA = a.capacity || 0;
      const capB = b.capacity || 0;
      if (capB !== capA) return capB - capA;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
    
    return upcoming[0];
  }, [events]);

  const sortedEvents = useMemo(
    () =>
      sortData(filteredEvents, (ev, key) => {
        if (key === 'event_date') return ev.event_date;
        if (key === 'title')      return ev.title;
        if (key === 'category')   return ev.category;
        if (key === 'status')     return ev.status;
        if (key === 'registrations') {
          const cap = ev.capacity ?? 0;
          const taken = cap - (ev.spots_available ?? 0);
          return cap > 0 ? taken / cap : -1;
        }
        return '';
      }),
    [filteredEvents, sortState] // eslint-disable-line
  );

  const renderRow = (ev: Event) => {
    const cfg = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.archived;

    return (
      <TableRow key={ev.id} accentColor={cfg.accent}>
        {/* Event (title + venue + RSVP badge) */}
        <TableCell>
          <div className="flex items-center gap-3">
            {ev.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ev.image_url}
                alt=""
                className="w-10 h-10 rounded object-cover border border-gray-200 shrink-0"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-gray-800 line-clamp-1">{ev.title}</div>
              {/* Venue (moved from separate column) */}
              {ev.venue && (
                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate max-w-[220px]">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {ev.venue}
                </div>
              )}
              {/* External RSVP indicator */}
              {ev.external_rsvp_url && (
                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-[#3BB0C9]/30 bg-[#e3f6fb] text-[#1a7a8f]">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  RSVP Linked
                </span>
              )}
            </div>
          </div>
        </TableCell>

        {/* Date & Time (start → end) */}
        <TableCell className="text-gray-600 whitespace-nowrap">
          <div className="font-medium">
            {new Date(ev.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {(ev.start_time || ev.end_time) && (
            <div className="text-[11px] mt-0.5 text-gray-400">
              {formatTime(ev.start_time)}
              {ev.start_time && ev.end_time && ' – '}
              {formatTime(ev.end_time)}
            </div>
          )}
        </TableCell>

        {/* Registrations progress bar */}
        <TableCell>
          {ev.external_rsvp_url ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#e3f6fb] text-[#1a7a8f] border border-[#3BB0C9]/20 font-helvetica uppercase tracking-wide">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              External
            </span>
          ) : (
            <RegistrationBar capacity={ev.capacity} spotsAvailable={ev.spots_available} />
          )}
        </TableCell>

        {/* Category */}
        <TableCell>
          <Badge colorClass="bg-[#e3f6fb] text-[#1a7a8f]">{ev.category}</Badge>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge colorClass={cfg.colorClass} dotColor={cfg.dotColor}>{ev.status}</Badge>
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            {ev.status === 'draft' && (
              <button
                onClick={() => handleStatusChange(ev.id, 'published')}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#3FAE2A]/10 transition-colors"
                title="Publish"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            )}
            {ev.status === 'published' && (
              <button
                onClick={() => handleStatusChange(ev.id, 'draft')}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Unpublish"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            )}
            <Link
              href={`/admin/events/${ev.id}/edit`}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3BB0C9] hover:bg-[#e3f6fb] transition-colors"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </Link>
            <button
              onClick={() => handleDelete(ev.id)}
              disabled={deleting === ev.id}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5 w-full pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold font-butler" style={{ color: '#1a2e1a' }}>
            Event Management
          </h2>
          <p className="text-[13px] mt-0.5 font-helvetica" style={{ color: '#939498' }}>
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
          { label: 'Total Events', value: stats.total,     accent: '#1a2e1a', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
          { label: 'Published',    value: stats.published, accent: '#3FAE2A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Drafts',       value: stats.draft,     accent: '#FFB547', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
          { label: 'Upcoming',     value: stats.upcoming,  accent: '#3BB0C9', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} icon={s.icon} />
        ))}
      </div>

      {/* Next Major Event Hero Card */}
      {nextMajorEvent && (
        <div className="relative rounded-2xl overflow-hidden shadow-lg p-7" style={{ background: '#1c3829' }}>
          {/* Subtle abstract shapes for background */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'rgba(255,181,71,0.05)', border: '1px solid rgba(255,255,255,0.05)' }} />
          <div className="absolute right-10 -bottom-10 w-32 h-32 rounded-full pointer-events-none" style={{ background: 'rgba(63,174,42,0.08)' }} />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 z-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/30 text-[11px] font-bold uppercase tracking-wider mb-3">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Next Major Event
              </div>
              <h3 className="text-white text-[26px] font-bold font-butler leading-tight tracking-tight mb-2">
                {nextMajorEvent.title}
              </h3>
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-[13px] font-medium font-helvetica">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-[#3FAE2A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(nextMajorEvent.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {nextMajorEvent.venue && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#3BB0C9]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {nextMajorEvent.venue}
                  </span>
                )}
                {nextMajorEvent.capacity && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#FFB547]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {nextMajorEvent.capacity - (nextMajorEvent.spots_available ?? 0)} / {nextMajorEvent.capacity} Registered
                  </span>
                )}
              </div>
            </div>
            
            {/* CTA Aspect */}
            <div className="flex flex-col gap-3 min-w-[160px]">
              <Link 
                href={`/admin/events/${nextMajorEvent.id}/edit`} 
                className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 bg-[#FFB547] text-[#1c3829] rounded-xl text-sm font-bold shadow-lg shadow-[#FFB547]/20 transition-all hover:brightness-110 font-helvetica"
              >
                Manage Event
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <FilterPills
        options={['all', 'published', 'draft', 'archived']}
        activeValue={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Table with built-in pagination */}
      <TableWrapper
        data={sortedEvents}
        renderRow={renderRow}
        colCount={6}
        loading={loading}
        defaultPageSize={10}
        emptyState={
          <div>
            <div className="mb-2">No events found</div>
            <Link href="/admin/events/new" className="text-[#3FAE2A] font-medium hover:underline">
              Create your first event →
            </Link>
          </div>
        }
      >
        {/* thead passed as children */}
        <TableHead>
          <TableHeader sortKey="title"         sortState={sortState} onSort={handleSort}>Event</TableHeader>
          <TableHeader sortKey="event_date"    sortState={sortState} onSort={handleSort}>Date &amp; Time</TableHeader>
          <TableHeader sortKey="registrations" sortState={sortState} onSort={handleSort}>Registrations</TableHeader>
          <TableHeader sortKey="category"      sortState={sortState} onSort={handleSort}>Category</TableHeader>
          <TableHeader sortKey="status"        sortState={sortState} onSort={handleSort}>Status</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
      </TableWrapper>
    </div>
  );
}