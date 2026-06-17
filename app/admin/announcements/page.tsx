"use client";

import React, { useEffect, useState } from 'react';
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
} from '@/components/admin/ui/Table';

interface Announcement {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
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

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchAnnouncements = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      try {
        const r = await fetch(`/api/admin/announcements?${params}`);
        const d = await r.json();
        if (active) setItems(d.announcements ?? []);
      } catch {
        if (active) toast.error('Failed to load announcements.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAnnouncements();
    return () => { active = false; };
  }, [statusFilter, toast]);

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
          { label: 'Total',      value: stats.total,     accent: '#1a2e1a' },
          { label: 'Published',  value: stats.published, accent: '#3FAE2A' },
          { label: 'Drafts',     value: stats.draft,     accent: '#FFB547' },
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
          {['Title', 'Category', 'Status', 'Last Updated', 'Actions'].map((header) => (
            <TableHeader
              key={header}
              className={header === 'Actions' ? 'text-right' : ''}
            >
              {header}
            </TableHeader>
          ))}
        </TableHead>
        <TableBody>
          {loading ? (
            [...Array(4)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-3 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-14 text-center">
                <div className="text-[13px] mb-2" style={{ color: '#939498' }}>No announcements yet</div>
                <Link href="/admin/announcements/new" className="text-[13px] font-medium hover:underline" style={{ color: '#3FAE2A' }}>
                  Post your first announcement →
                </Link>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const ss = STATUS_STYLE[item.status];
              const cs = CATEGORY_STYLE[item.category] ?? { bg: '#f0f0f0', color: '#585859' };
              const isBusy = busy === item.id;
              return (
                <TableRow key={item.id} className={isBusy ? 'opacity-60' : ''}>
                  <TableCell>
                    <div className="text-[13px] font-medium" style={{ color: '#1a2e1a' }}>{item.title}</div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{ background: cs.bg, color: cs.color }}>
                      {item.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium capitalize"
                      style={{ background: ss.bg, color: ss.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.dot }} />
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[12px]" style={{ color: '#585859' }}>
                    {new Date(item.updated_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3">
                      {item.status === 'draft' && (
                        <button disabled={isBusy}
                          onClick={() => handleStatusChange(item.id, 'published', 'published')}
                          className="text-[12px] font-medium hover:underline disabled:opacity-40"
                          style={{ color: '#3FAE2A' }}>
                          Publish
                        </button>
                      )}
                      {item.status === 'published' && (
                        <button disabled={isBusy}
                          onClick={() => handleStatusChange(item.id, 'archived', 'archived')}
                          className="text-[12px] font-medium hover:underline disabled:opacity-40"
                          style={{ color: '#FFB547' }}>
                          Archive
                        </button>
                      )}
                      {item.status === 'archived' && (
                        <button disabled={isBusy}
                          onClick={() => handleStatusChange(item.id, 'published', 're-published')}
                          className="text-[12px] font-medium hover:underline disabled:opacity-40"
                          style={{ color: '#3BB0C9' }}>
                          Restore
                        </button>
                      )}
                      <Link href={`/admin/announcements/${item.id}/edit`}
                        className="text-[12px] font-medium hover:underline" style={{ color: '#3FAE2A' }}>
                        Edit
                      </Link>
                      <button disabled={isBusy} onClick={() => handleDelete(item.id, item.title)}
                        className="text-[12px] font-medium hover:underline disabled:opacity-40"
                        style={{ color: '#C51A4A' }}>
                        {isBusy ? '…' : 'Delete'}
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
