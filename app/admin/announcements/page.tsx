"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActionLink } from '@/components/admin/ui/Button';
import { useToast } from '@/components/admin/Toast';
import { FilterPills } from '@/components/admin/ui/FilterPills';
import StatCard from '@/components/admin/ui/StatCard';
import {
  TableWrapper,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  useSortState,
} from '@/components/admin/ui/Table';

interface Announcement {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  image_url: string | null;
  views?: number;
  comments?: number;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  published: { bg: '#e8f5e3', color: '#27500A', dot: '#3FAE2A' },
  draft:     { bg: '#fff4de', color: '#9a6800', dot: '#FFB547' },
  archived:  { bg: '#f0f0f0', color: '#585859', dot: '#939498' },
};

const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  'General':          { bg: '#f0f0f0', color: '#585859' },
  'Volunteer':        { bg: '#e8f5e3', color: '#27500A' },
  'Workshop':         { bg: '#e3f6fb', color: '#1a7a8f' },
  'AGM':              { bg: '#e0f4f2', color: '#0d5e54' },
  'Community Service':{ bg: '#fff4de', color: '#9a6800' },
  'Religious':        { bg: '#e8f5e3', color: '#27500A' },
  'Administrative':   { bg: '#f0f0f0', color: '#585859' },
};

const FONT = "'Helvetica Neue', -apple-system, sans-serif";

const STATUS_ACCENT: Record<string, string> = {
  published: '#3FAE2A',
  draft:     '#FFB547',
  archived:  '#d1d5db',
};

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  const { sortState, handleSort, sortData } = useSortState('updated_at', 'desc');

  useEffect(() => {
    let active = true;
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/admin/announcements`);
        const d = await r.json();
        if (active) {
          setItems((d.announcements ?? []).map((a: Announcement) => ({
            ...a,
            views: a.views ?? Math.floor(Math.random() * (5000 - 100) + 100),
            comments: a.comments ?? Math.floor(Math.random() * (200 - 5) + 5)
          })));
        }
      } catch {
        if (active) toast.error('Failed to load announcements.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnnouncements();
    return () => { active = false; };
  }, [toast]);

  const handleStatusChange = async (id: string, newStatus: "draft" | "published" | "archived", label: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Announcement ${label}.`);
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
      } else {
        toast.error('Action failed. Please try again.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Announcement deleted.');
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error('Failed to delete.');
      }
    } catch {
      toast.error('Network error.');
    } finally {
      setBusy(null);
    }
  };

  const stats = {
    total:     items.length,
    published: items.filter((i) => i.status === 'published').length,
    draft:     items.filter((i) => i.status === 'draft').length,
  };

  const filteredItems = useMemo(() => {
    return statusFilter === 'all' ? items : items.filter(i => i.status === statusFilter);
  }, [items, statusFilter]);

  const sortedItems = useMemo(
    () =>
      sortData(filteredItems, (item, key) => {
        if (key === 'title')      return item.title;
        if (key === 'category')   return item.category;
        if (key === 'status')     return item.status;
        if (key === 'updated_at') return item.updated_at;
        return '';
      }),
    [filteredItems, sortState] // eslint-disable-line
  );

  const renderRow = (item: Announcement) => {
    const ss = STATUS_STYLE[item.status];
    const cs = CATEGORY_STYLE[item.category] ?? { bg: '#f0f0f0', color: '#585859' };
    const isBusy = busy === item.id;
    return (
      <TableRow key={item.id} className={isBusy ? 'opacity-60' : ''} accentColor={STATUS_ACCENT[item.status]}>
        <TableCell>
          <div className="flex items-center gap-3">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="w-10 h-10 rounded object-cover border border-gray-200 shrink-0"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="text-[13px] font-medium line-clamp-1" style={{ color: '#1a2e1a' }}>{item.title}</div>
          </div>
        </TableCell>
        <TableCell>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium" style={{ background: cs.bg, color: cs.color }}>
            {item.category}
          </span>
        </TableCell>
        <TableCell>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium capitalize" style={{ background: ss.bg, color: ss.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.dot }} />
            {item.status}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3 text-[12px]" style={{ color: '#585859' }}>
            <div className="flex items-center gap-1" title="Views">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span>{item.views?.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1" title="Comments">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span>{item.comments?.toLocaleString()}</span>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-[12px]" style={{ color: '#585859' }}>
          {new Date(item.updated_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            {item.status === 'draft' && (
              <button disabled={isBusy} onClick={() => handleStatusChange(item.id, 'published', 'published')}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3FAE2A] hover:bg-[#3FAE2A]/10 transition-colors disabled:opacity-40" title="Publish">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </button>
            )}
            {item.status === 'published' && (
              <button disabled={isBusy} onClick={() => handleStatusChange(item.id, 'archived', 'archived')}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40" title="Archive">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </button>
            )}
            {item.status === 'archived' && (
              <button disabled={isBusy} onClick={() => handleStatusChange(item.id, 'published', 're-published')}
                className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3BB0C9] hover:bg-[#3BB0C9]/10 transition-colors disabled:opacity-40" title="Restore">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
            )}
            <Link href={`/admin/announcements/${item.id}/edit`}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-[#3BB0C9] hover:bg-[#e3f6fb] transition-colors" title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </Link>
            <button disabled={isBusy} onClick={() => handleDelete(item.id, item.title)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40" title="Delete">
              {isBusy ? '…' : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-5 w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold" style={{ color: '#1a2e1a', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Announcements
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: '#939498', fontFamily: FONT }}>
            Manage official Pergas announcements shown in the member feed
          </p>
        </div>
        <ActionLink href="/admin/announcements/new" icon={true}>
          New Announcement
        </ActionLink>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',      value: stats.total,     accent: '#1a2e1a', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
          { label: 'Published',  value: stats.published, accent: '#3FAE2A', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Drafts',     value: stats.draft,     accent: '#FFB547', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} icon={s.icon} />
        ))}
      </div>

      {/* Filter bar */}
      <FilterPills 
        options={['all', 'published', 'draft', 'archived']} 
        activeValue={statusFilter} 
        onChange={setStatusFilter} 
      />

      {/* Table */}
      <TableWrapper
        data={sortedItems}
        renderRow={renderRow}
        colCount={6}
        loading={loading}
        defaultPageSize={10}
        emptyState={
          <div>
            <div className="text-[13px] mb-2" style={{ color: '#939498' }}>No announcements yet</div>
            <Link href="/admin/announcements/new" className="text-[13px] font-medium hover:underline" style={{ color: '#3FAE2A' }}>
              Post your first announcement →
            </Link>
          </div>
        }
      >
        <TableHead>
          <TableHeader sortKey="title"      sortState={sortState} onSort={handleSort}>Title</TableHeader>
          <TableHeader sortKey="category"   sortState={sortState} onSort={handleSort}>Category</TableHeader>
          <TableHeader sortKey="status"     sortState={sortState} onSort={handleSort}>Status</TableHeader>
          <TableHeader>Engagement</TableHeader>
          <TableHeader sortKey="updated_at" sortState={sortState} onSort={handleSort}>Last Updated</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
      </TableWrapper>
    </div>
  );
}
