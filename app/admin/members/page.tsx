"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ActionButton } from '@/components/admin/ui/Button';
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

interface Member {
  id: string;
  full_name: string;
  email: string;
  member_id: string | null;
  membership_tier: string;
  membership_status: string;
  expiry_date: string | null;
  phone: string | null;
  created_at: string;
}

const TIER_COLORS: Record<string, string> = {
  ordinary: 'bg-[#e3f6fb] text-[#1a7a8f]',
  associate: 'bg-purple-50 text-purple-700',
  fellow: 'bg-[#e8f5e3] text-[#27500A]',
  professional: 'bg-[#fff4de] text-[#9a6800]',
  student: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#e8f5e3] text-[#27500A]',
  expired: 'bg-red-50 text-red-600',
  suspended: 'bg-gray-100 text-gray-500',
};


export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const fetchMembers = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      try {
        const r = await fetch(`/api/admin/members?${params}`);
        const d = await r.json();
        if (active) setMembers(d.members ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMembers();
    return () => { active = false; };
  }, [search, tierFilter, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Member ID', 'Tier', 'Status', 'Expiry Date', 'Joined'];
    const rows = members.map((m) => [
      m.full_name,
      m.email,
      m.member_id ?? '',
      m.membership_tier,
      m.membership_status,
      m.expiry_date ?? '',
      new Date(m.created_at).toLocaleDateString('en-SG'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pergas-members-${Date.now()}.csv`;
    a.click();
  };

  const stats = {
    total: members.length,
    active: members.filter((m) => m.membership_status === 'active').length,
    expired: members.filter((m) => m.membership_status === 'expired').length,
  };

  return (
    <div className="space-y-5 w-full pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold font-butler"  style={{ color: '#1a2e1a' }}>
            Member Directory
          </h2>
          <p className="text-[13px] mt-0.5 font-helvetica"  style={{ color: '#939498' }}>
            Manage and verify all Asatizah member records
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton
            onClick={handleExportCSV}
            variant="outline"
            icon={<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
          >
            Export CSV
          </ActionButton>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Members', value: stats.total, accent: '#1a2e1a' },
          { label: 'Active Members', value: stats.active, accent: '#3FAE2A' },
          { label: 'Expired', value: stats.expired, accent: '#C51A4A' },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm font-helvetica" >
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              placeholder="Search by name, email, or member ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="h-10 px-3 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="ordinary">Ordinary</option>
            <option value="associate">Associate</option>
            <option value="fellow">Fellow</option>
            <option value="professional">Professional</option>
            <option value="student">Student</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 min-w-[140px] rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3FAE2A] focus:ring-4 focus:ring-[#3FAE2A]/10 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <TableWrapper>
        <TableHead>
          <TableHeader>Member</TableHeader>
          <TableHeader>Member ID</TableHeader>
          <TableHeader>Tier</TableHeader>
          <TableHeader>Status</TableHeader>
          <TableHeader>Expiry</TableHeader>
          <TableHeader className="text-right">Actions</TableHeader>
        </TableHead>
        <TableBody>
          {loading ? (
            [...Array(5)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(6)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-3 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-gray-500">
                No members found matching your criteria.
              </TableCell>
            </TableRow>
          ) : (
            members.map((m) => {
              const statusConfig =
                m.membership_status === 'active'
                  ? { colorClass: 'bg-[#e8f5e3] text-[#27500A]', dotColor: 'bg-[#3FAE2A]' }
                  : m.membership_status === 'expired'
                    ? { colorClass: 'bg-red-50 text-red-600', dotColor: 'bg-[#C51A4A]' }
                    : m.membership_status === 'pending'
                      ? { colorClass: 'bg-[#fff4de] text-[#9a6800]', dotColor: 'bg-[#FFB547]' }
                      : { colorClass: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' };

              const tierClass = TIER_COLORS[m.membership_tier] ?? 'bg-gray-100 text-gray-600';

              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8f5e3] flex items-center justify-center text-[#27500A] text-[10px] font-bold flex-shrink-0">
                        {(m.full_name ?? m.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800">{m.full_name ?? '—'}</div>
                        <div className="text-gray-500 text-[11px] mt-0.5">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 font-mono text-[12px]">
                    {m.member_id ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge colorClass={tierClass}>
                      {m.membership_tier ?? 'ordinary'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge colorClass={statusConfig.colorClass} dotColor={statusConfig.dotColor}>
                      {m.membership_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="text-[#3FAE2A] hover:text-[#27500A] text-[12px] font-bold transition-colors uppercase tracking-wide"
                      >
                        View Profile
                      </Link>
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
